using AstroPlanner.Api.Data;
using AstroPlanner.Api.Dtos;
using AstroPlanner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace AstroPlanner.Api.Controllers;

[ApiController]
[Route("api/observations")]
[Authorize]
public class ObservationsController : ControllerBase
{
    private static readonly DateTime MinDate = new(1900, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db;
    private readonly IAuthorizationService _auth;

    public ObservationsController(AppDbContext db, IAuthorizationService auth)
    {
        _db = db;
        _auth = auth;
    }

    private int CurrentUserId() => int.Parse(User.FindFirst("sub")!.Value, CultureInfo.InvariantCulture);

    private static IQueryable<ObservationDto> Project(IQueryable<ObservationLog> source) =>
        source.Select(l => new ObservationDto(
            l.Id, l.UserId, l.CelestialObjectId, l.CelestialObject.Name,
            l.LocationId, l.Location.Name, l.ObservedAtUtc, l.Notes));

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    private async Task<bool> ValidateAsync(ObservationRequest req, DateTime observedAtUtc)
    {
        if (observedAtUtc < MinDate || observedAtUtc > DateTime.UtcNow.AddDays(1))
            ModelState.AddModelError("observedAtUtc", "Дата має бути між 1900 роком і завтрашнім днем.");

        if (!await _db.CelestialObjects.AnyAsync(o => o.Id == req.CelestialObjectId!.Value))
            ModelState.AddModelError("celestialObjectId", "Такого об'єкта немає в каталозі.");

        if (!await _db.Locations.AnyAsync(l => l.Id == req.LocationId!.Value))
            ModelState.AddModelError("locationId", "Такого місця немає.");

        return ModelState.IsValid;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ObservationDto>>> GetAll([FromQuery] ObservationQuery q)
    {
        var query = _db.ObservationLogs.AsNoTracking().AsQueryable();

        if (!User.IsInRole("Admin"))
        {
            var userId = CurrentUserId();
            query = query.Where(l => l.UserId == userId);
        }

        if (q.ObjectId.HasValue) query = query.Where(l => l.CelestialObjectId == q.ObjectId.Value);
        if (q.LocationId.HasValue) query = query.Where(l => l.LocationId == q.LocationId.Value);
        if (q.From.HasValue) query = query.Where(l => l.ObservedAtUtc >= q.From.Value);
        if (q.To.HasValue) query = query.Where(l => l.ObservedAtUtc <= q.To.Value);

        var total = await query.CountAsync();
        var items = await Project(query.OrderByDescending(l => l.ObservedAtUtc).ThenBy(l => l.Id)
                .Skip((q.Page - 1) * q.PageSize)
                .Take(q.PageSize))
            .ToListAsync();

        return new PagedResult<ObservationDto>(total, q.Page, q.PageSize, items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ObservationDto>> GetById(int id)
    {
        var entity = await _db.ObservationLogs.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id);
        if (entity is null) return NotFound();

        var result = await _auth.AuthorizeAsync(User, entity, "OwnerOrAdmin");
        if (!result.Succeeded) return Forbid();

        return await Project(_db.ObservationLogs.AsNoTracking().Where(l => l.Id == id)).FirstAsync();
    }

    [HttpPost]
    public async Task<ActionResult<ObservationDto>> Create(ObservationRequest req)
    {
        var observedAt = NormalizeUtc(req.ObservedAtUtc!.Value);
        if (!await ValidateAsync(req, observedAt)) return ValidationProblem(ModelState);

        var entity = new ObservationLog
        {
            UserId = CurrentUserId(),
            CelestialObjectId = req.CelestialObjectId!.Value,
            LocationId = req.LocationId!.Value,
            ObservedAtUtc = observedAt,
            Notes = req.Notes?.Trim() ?? string.Empty
        };

        _db.ObservationLogs.Add(entity);
        await _db.SaveChangesAsync();

        var dto = await Project(_db.ObservationLogs.AsNoTracking().Where(l => l.Id == entity.Id)).FirstAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ObservationRequest req)
    {
        var entity = await _db.ObservationLogs.FindAsync(id);
        if (entity is null) return NotFound();

        var result = await _auth.AuthorizeAsync(User, entity, "OwnerOrAdmin");
        if (!result.Succeeded) return Forbid();

        var observedAt = NormalizeUtc(req.ObservedAtUtc!.Value);
        if (!await ValidateAsync(req, observedAt)) return ValidationProblem(ModelState);

        entity.CelestialObjectId = req.CelestialObjectId!.Value;
        entity.LocationId = req.LocationId!.Value;
        entity.ObservedAtUtc = observedAt;
        entity.Notes = req.Notes?.Trim() ?? string.Empty;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.ObservationLogs.FindAsync(id);
        if (entity is null) return NotFound();

        var result = await _auth.AuthorizeAsync(User, entity, "OwnerOrAdmin");
        if (!result.Succeeded) return Forbid();

        _db.ObservationLogs.Remove(entity);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}