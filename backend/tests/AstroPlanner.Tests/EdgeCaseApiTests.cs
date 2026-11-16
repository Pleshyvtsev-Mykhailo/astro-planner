using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AstroPlanner.Tests;

public class BoundaryApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public BoundaryApiTests(ApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("latitude=90&longitude=180&date=2026-11-15")]
    [InlineData("latitude=-90&longitude=-180&date=2026-11-15")]
    [InlineData("latitude=0&longitude=0&date=1900-01-01")]
    [InlineData("latitude=0&longitude=0&date=2100-12-31")]
    public async Task Visibility_AtBoundaryValues_ReturnsOk(string query)
    {
        var response = await _factory.CreateClient().GetAsync($"/api/visibility?{query}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("latitude=90.01&longitude=0")]
    [InlineData("latitude=0&longitude=-180.01")]
    [InlineData("latitude=0&longitude=0&date=2101-01-01")]
    public async Task Visibility_JustOutsideBoundary_ReturnsBadRequest(string query)
    {
        var response = await _factory.CreateClient().GetAsync($"/api/visibility?{query}");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Location_AtBoundaryCoordinates_IsAccepted()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.PostAsJsonAsync("/api/locations",
            new { name = "Межа", latitude = 90, longitude = -180 });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}

public class EmptyCatalogApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public EmptyCatalogApiTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task EmptyCatalog_ReturnsEmptyLists()
    {
        var admin = await _factory.AdminAsync();
        var page = await admin.GetFromJsonAsync<JsonElement>("/api/objects?pageSize=100");
        foreach (var item in page.GetProperty("items").EnumerateArray())
        {
            var delete = await admin.DeleteAsync($"/api/objects/{item.GetProperty("id").GetInt32()}");
            Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        }

        var objects = await admin.GetFromJsonAsync<JsonElement>("/api/objects");
        var visibility = await admin.GetFromJsonAsync<JsonElement>(
            "/api/visibility?latitude=50&longitude=30&date=2026-11-15");

        Assert.Equal(0, objects.GetProperty("total").GetInt32());
        Assert.Equal(0, visibility.GetProperty("items").GetArrayLength());
    }
}