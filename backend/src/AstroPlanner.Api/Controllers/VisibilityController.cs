using AstroPlanner.Api.Data;
using AstroPlanner.Api.Dtos;
using AstroPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AstroPlanner.Api.Controllers;

[ApiController]
[Route("api/visibility")]
public class VisibilityController : ControllerBase
{
    private static readonly DateOnly MinDate = new(1900, 1, 1);
    private static readonly DateOnly MaxDate = new(2100, 12, 31);

    private readonly AppDbContext _db;

    public VisibilityController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<VisibilityResponse>> Get([FromQuery] VisibilityQuery q)
    {
        var date = ResolveDate(q.Date);
        if (date is null) return ValidationProblem(ModelState);

        var lat = q.Latitude!.Value;
        var lon = q.Longitude!.Value;

        var query = _db.CelestialObjects.AsNoTracking().AsQueryable();
        if (q.ObjectId.HasValue) query = query.Where(o => o.Id == q.ObjectId.Value);

        var objects = await query.ToListAsync();
        if (q.ObjectId.HasValue && objects.Count == 0) return NotFound();

        var items = objects
            .Select(o =>
            {
                var samples = VisibilityCalculator.Sample(o.RightAscensionHours, o.DeclinationDegrees, lat, lon, date.Value);
                var s = VisibilityCalculator.Summarize(samples, q.MinAltitude);
                return new VisibilityItem(
                    o.Id, o.Name, o.CommonName,
                    AstroMath.ClassifyHorizon(o.DeclinationDegrees, lat),
                    s.HoursAboveMin > 0,
                    Round(s.BestAltitude),
                    s.BestTimeUtc,
                    Math.Round(s.HoursAboveMin, 2));
            })
            .OrderByDescending(i => i.HoursAboveMinAltitude)
            .ThenBy(i => i.Name)
            .ToList();

        return new VisibilityResponse(
            lat, lon, date.Value, q.MinAltitude,
            Math.Round(VisibilityCalculator.DarkHours(lat, lon, date.Value), 2),
            items);
    }

    [HttpGet("{objectId:int}/curve")]
    public async Task<ActionResult<CurveResponse>> Curve(int objectId, [FromQuery] CoordinateQuery q)
    {
        var date = ResolveDate(q.Date);
        if (date is null) return ValidationProblem(ModelState);

        var o = await _db.CelestialObjects.AsNoTracking().FirstOrDefaultAsync(x => x.Id == objectId);
        if (o is null) return NotFound();

        var points = VisibilityCalculator
            .Sample(o.RightAscensionHours, o.DeclinationDegrees, q.Latitude!.Value, q.Longitude!.Value, date.Value)
            .Select(s => new CurvePoint(s.TimeUtc, Math.Round(s.AltitudeDegrees, 2), Math.Round(s.SunAltitudeDegrees, 2)))
            .ToList();

        return new CurveResponse(o.Id, o.Name, points);
    }

    private DateOnly? ResolveDate(DateOnly? requested)
    {
        var date = requested ?? DateOnly.FromDateTime(DateTime.UtcNow);
        if (date >= MinDate && date <= MaxDate) return date;

        ModelState.AddModelError("date", "Дата має бути між 1900-01-01 і 2100-12-31.");
        return null;
    }

    private static double? Round(double? value) => value is null ? null : Math.Round(value.Value, 2);
}