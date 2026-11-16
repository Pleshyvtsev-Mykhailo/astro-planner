using System.Text;
using AstroPlanner.Api.Models;
using AstroPlanner.Api.Services;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace AstroPlanner.Tests;

public class TokenServiceTests
{
    [Fact]
    public async Task CreatedToken_IsValidAndContainsClaims()
    {
        var settings = new JwtSettings("iss", "aud", new string('k', 40), 5);
        var service = new TokenService(settings);
        var user = new AppUser { Id = 7, Username = "anna", Role = "Admin" };

        var (token, expires) = service.Create(user);

        var result = await new JsonWebTokenHandler().ValidateTokenAsync(token, new TokenValidationParameters
        {
            ValidIssuer = "iss",
            ValidAudience = "aud",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Secret))
        });

        Assert.True(result.IsValid);
        Assert.Equal("7", result.ClaimsIdentity.FindFirst("sub")!.Value);
        Assert.Equal("Admin", result.ClaimsIdentity.FindFirst("role")!.Value);
        Assert.True(expires > DateTime.UtcNow);
    }

    [Fact]
    public async Task TokenSignedWithAnotherKey_IsRejected()
    {
        var service = new TokenService(new JwtSettings("iss", "aud", new string('a', 40), 5));
        var (token, _) = service.Create(new AppUser { Id = 1, Username = "u", Role = "User" });

        var result = await new JsonWebTokenHandler().ValidateTokenAsync(token, new TokenValidationParameters
        {
            ValidIssuer = "iss",
            ValidAudience = "aud",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(new string('b', 40)))
        });

        Assert.False(result.IsValid);
    }
}