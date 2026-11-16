using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AstroPlanner.Api.Models;
using AstroPlanner.Api.Services;
using Xunit;

namespace AstroPlanner.Tests;

public class AuthApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AuthApiTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Register_CreatesUser_AndDuplicateIsConflictIgnoringCase()
    {
        var client = _factory.CreateClient();
        var name = "Anna" + Guid.NewGuid().ToString("N")[..6];

        var first = await client.PostAsJsonAsync("/api/auth/register", new { username = name, password = "Passw0rd123" });
        var second = await client.PostAsJsonAsync("/api/auth/register",
            new { username = name.ToLowerInvariant(), password = "Passw0rd123" });

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Theory]
    [InlineData("ab", "Passw0rd123")]
    [InlineData("valid_name", "123")]
    [InlineData("bad name!", "Passw0rd123")]
    public async Task Register_InvalidInput_ReturnsBadRequest(string username, string password)
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/register", new { username, password });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { username = "admin", password = "wrong-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownUser_ReturnsUnauthorized()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { username = "nobody-here", password = "Passw0rd123" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_AsAdmin_ReturnsTokenWithAdminRole()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { username = "admin", password = ApiFactory.AdminPassword });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(body.GetProperty("accessToken").GetString()));
        Assert.Equal("Admin", body.GetProperty("role").GetString());
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _factory.CreateClient().GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_AsAdmin_ReturnsAdminRole()
    {
        var admin = await _factory.AdminAsync();
        var me = await admin.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.Equal("Admin", me.GetProperty("role").GetString());
        Assert.Equal("admin", me.GetProperty("username").GetString());
    }

    [Fact]
    public async Task Users_AsRegularUser_IsForbidden()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Users_AsAdmin_ReturnsListWithoutPasswordHash()
    {
        var admin = await _factory.AdminAsync();
        var response = await admin.GetAsync("/api/users");
        var text = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("admin", text);
        Assert.DoesNotContain("passwordhash", text, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ExpiredToken_IsRejected()
    {
        var expiredService = new TokenService(_factory.Jwt with { ExpiresMinutes = -10 });
        var (token, _) = expiredService.Create(new AppUser { Id = 1, Username = "admin", Role = "Admin" });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}