using AstroPlanner.Api.Data;
using AstroPlanner.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AstroPlanner.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        return await _db.Users.AsNoTracking()
            .OrderBy(u => u.Id)
            .Select(u => new UserDto(u.Id, u.Username, u.Role))
            .ToListAsync();
    }
}