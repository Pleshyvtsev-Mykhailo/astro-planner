using System.Security.Claims;
using AstroPlanner.Api.Models;
using AstroPlanner.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace AstroPlanner.Tests;

public class ObservationOwnerHandlerTests
{
    private static async Task<bool> Check(string sub, string role, int ownerId)
    {
        var identity = new ClaimsIdentity(
            new[] { new Claim("sub", sub), new Claim("role", role) }, "test", "name", "role");
        var requirement = new OwnerOrAdminRequirement();
        var context = new AuthorizationHandlerContext(
            new[] { requirement }, new ClaimsPrincipal(identity), new ObservationLog { UserId = ownerId });

        await new ObservationOwnerHandler().HandleAsync(context);
        return context.HasSucceeded;
    }

    [Fact]
    public async Task Owner_IsAllowed() => Assert.True(await Check("5", "User", 5));

    [Fact]
    public async Task Admin_IsAllowedForForeignRecord() => Assert.True(await Check("1", "Admin", 5));

    [Fact]
    public async Task OtherUser_IsDenied() => Assert.False(await Check("6", "User", 5));
}