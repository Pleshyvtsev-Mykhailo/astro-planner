using AstroPlanner.Api.Data;
using AstroPlanner.Api.Dtos;
using AstroPlanner.Api.Models;
using AstroPlanner.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AstroPlanner.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;
    private readonly PasswordHasher<AppUser> _hasher = new();

    public AuthController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterRequest req)
    {
        var username = req.Username.Trim();
        if (await _db.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Ім'я зайняте",
                detail: "Користувач із таким іменем уже існує.");
        }

        var user = new AppUser { Username = username, Role = "User" };
        user.PasswordHash = _hasher.HashPassword(user, req.Password);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new UserDto(user.Id, user.Username, user.Role));
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest req)
    {
        var username = req.Username.Trim();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

        var ok = user is not null &&
                 _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) != PasswordVerificationResult.Failed;
        if (!ok)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Невірний логін або пароль");
        }

        var (token, expires) = _tokens.Create(user!);
        return new LoginResponse(token, expires, user!.Username, user.Role);
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<UserDto> Me()
    {
        var id = int.Parse(User.FindFirst("sub")!.Value);
        return new UserDto(id, User.FindFirst("name")!.Value, User.FindFirst("role")!.Value);
    }
}