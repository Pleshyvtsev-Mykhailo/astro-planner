using System.ComponentModel.DataAnnotations;

namespace AstroPlanner.Api.Dtos;

public class RegisterRequest
{
    [Required, StringLength(50, MinimumLength = 3)]
    [RegularExpression(@"^[A-Za-z0-9_.-]+$", ErrorMessage = "Дозволені лише латинські літери, цифри та символи _ . -")]
    public string Username { get; set; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required, StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string Password { get; set; } = string.Empty;
}

public record UserDto(int Id, string Username, string Role);

public record LoginResponse(string AccessToken, DateTime ExpiresAtUtc, string Username, string Role);