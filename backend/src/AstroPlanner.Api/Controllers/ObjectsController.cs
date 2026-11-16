using AstroPlanner.Api.Data;
using AstroPlanner.Api.Dtos;
using AstroPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AstroPlanner.Api.Controllers;

[ApiController]
[Route("api/objects")]
public class ObjectsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ObjectsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<ObjectDto>>> GetAll([FromQuery] ObjectQuery q)
    {
        var query = _db.CelestialObjects.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var pattern = $"%{q.Search.Trim()}%";
            query = query.Where(o => EF.Functions.Like(o.Name, pattern)
                                  || EF.Functions.Like(o.CommonName, pattern));
        }
        if (q.Type.HasValue) query = query.Where(o => o.Type == q.Type.Value);
        if (q.MinMagnitude.HasValue) query = query.Where(o => o.Magnitude >= q.MinMagnitude.Value);
        if (q.MaxMagnitude.HasValue) query = query.Where(o => o.Magnitude <= q.MaxMagnitude.Value);

        query = q.SortBy switch
        {
            "magnitude" => q.Descending ? query.OrderByDescending(o => o.Magnitude) : query.OrderBy(o => o.Magnitude),
            "ra" => q.Descending ? query.OrderByDescending(o => o.RightAscensionHours) : query.OrderBy(o => o.RightAscensionHours),
            "dec" => q.Descending ? query.OrderByDescending(o => o.DeclinationDegrees) : query.OrderBy(o => o.DeclinationDegrees),
            _ => q.Descending ? query.OrderByDescending(o => o.Name) : query.OrderBy(o => o.Name)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(o => new ObjectDto(o.Id, o.Name, o.CommonName, o.Type,
                o.RightAscensionHours, o.DeclinationDegrees, o.Magnitude))
            .ToListAsync();

        return new PagedResult<ObjectDto>(total, q.Page, q.PageSize, items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ObjectDto>> GetById(int id)
    {
        var entity = await _db.CelestialObjects.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound();
        return entity.ToDto();
    }

    [HttpPost]
    public async Task<ActionResult<ObjectDto>> Create(ObjectRequest req)
    {
        var name = req.Name.Trim();
        if (await _db.CelestialObjects.AnyAsync(x => x.Name == name))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Об'єкт уже існує",
                detail: $"Об'єкт {name} уже є в каталозі.");

        var entity = new CelestialObject();
        req.ApplyTo(entity);
        _db.CelestialObjects.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity.ToDto());
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ObjectRequest req)
    {
        var entity = await _db.CelestialObjects.FindAsync(id);
        if (entity is null) return NotFound();

        var name = req.Name.Trim();
        if (await _db.CelestialObjects.AnyAsync(x => x.Name == name && x.Id != id))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Об'єкт уже існує",
                detail: $"Інший об'єкт {name} уже є в каталозі.");

        req.ApplyTo(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.CelestialObjects.FindAsync(id);
        if (entity is null) return NotFound();

        if (await _db.ObservationLogs.AnyAsync(l => l.CelestialObjectId == id))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Не можна видалити",
                detail: "Для цього об'єкта є записи в журналі спостережень.");

        _db.CelestialObjects.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}