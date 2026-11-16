using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AstroPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;

namespace AstroPlanner.Tests;

public class ApiFactory : WebApplicationFactory<Program>
{
    public const string AdminPassword = "Admin123!";
    private const string TestSecret = "test-secret-for-integration-tests-0123456789";

    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"astro-test-{Guid.NewGuid():N}.db");

    public ApiFactory()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
        Environment.SetEnvironmentVariable("Jwt__Secret", TestSecret);
        Environment.SetEnvironmentVariable("Seed__AdminPassword", AdminPassword);
        Environment.SetEnvironmentVariable("ConnectionStrings__Default", $"Data Source={_dbPath}");
    }

    public JwtSettings Jwt => Services.GetRequiredService<JwtSettings>();

    public async Task<HttpClient> LoginAsync(string username, string password)
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { username, password });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.GetProperty("accessToken").GetString());
        return client;
    }

    public Task<HttpClient> AdminAsync() => LoginAsync("admin", AdminPassword);

    public async Task<HttpClient> NewUserAsync()
    {
        var name = "u" + Guid.NewGuid().ToString("N")[..10];
        var response = await CreateClient().PostAsJsonAsync("/api/auth/register",
            new { username = name, password = "Passw0rd123" });
        response.EnsureSuccessStatusCode();
        return await LoginAsync(name, "Passw0rd123");
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (!disposing) return;

        SqliteConnection.ClearAllPools();
        try
        {
            File.Delete(_dbPath);
        }
        catch (Exception)
        {

        }
    }
}