using AstroPlanner.Api.Data;
using AstroPlanner.Api.Dtos;
using AstroPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace AstroPlanner.Api.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public LocationsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<LocationDto>>> GetAll([FromQuery] LocationQuery q)
    {
        var query = _db.Locations.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var pattern = $"%{q.Search.Trim()}%";
            query = query.Where(l => EF.Functions.Like(l.Name, pattern));
        }

        query = q.SortBy switch
        {
            "latitude" => q.Descending ? query.OrderByDescending(l => l.Latitude) : query.OrderBy(l => l.Latitude),
            "longitude" => q.Descending ? query.OrderByDescending(l => l.Longitude) : query.OrderBy(l => l.Longitude),
            _ => q.Descending ? query.OrderByDescending(l => l.Name) : query.OrderBy(l => l.Name)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(l => new LocationDto(l.Id, l.Name, l.Latitude, l.Longitude))
            .ToListAsync();

        return new PagedResult<LocationDto>(total, q.Page, q.PageSize, items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LocationDto>> GetById(int id)
    {
        var entity = await _db.Locations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();
        return entity.ToDto();
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<LocationDto>> Create(LocationRequest req)
    {
        var entity = new Location();
        req.ApplyTo(entity);
        _db.Locations.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity.ToDto());
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, LocationRequest req)
    {
        var entity = await _db.Locations.FindAsync(id);
        if (entity is null) return NotFound();

        req.ApplyTo(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Locations.FindAsync(id);
        if (entity is null) return NotFound();

        if (await _db.ObservationLogs.AnyAsync(l => l.LocationId == id))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Не можна видалити",
                detail: "Для цього місця є записи в журналі спостережень.");

        _db.Locations.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}