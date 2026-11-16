using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AstroPlanner.Tests;

public class LocationsApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public LocationsApiTests(ApiFactory factory) => _factory = factory;

    private static object Body(string name, double lat = 10, double lon = 20) =>
        new { name, latitude = lat, longitude = lon };

    [Fact]
    public async Task GetAll_ReturnsSeededLocations()
    {
        var json = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/locations");
        Assert.True(json.GetProperty("total").GetInt32() >= 3);
    }

    [Fact]
    public async Task GetAll_Search_FindsKyiv()
    {
        var json = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/locations?search=Київ");
        Assert.True(json.GetProperty("items").GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Create_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/locations", Body("Тест"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_AsRegularUser_Succeeds()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.PostAsJsonAsync("/api/locations", Body("Тестове місце"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Theory]
    [InlineData(95, 20)]
    [InlineData(-95, 20)]
    [InlineData(10, 200)]
    [InlineData(10, -181)]
    public async Task Create_OutOfRangeCoordinates_ReturnsBadRequest(double lat, double lon)
    {
        var user = await _factory.NewUserAsync();
        var response = await user.PostAsJsonAsync("/api/locations", Body("Межа", lat, lon));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AsRegularUser_ReturnsForbidden()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.DeleteAsync("/api/locations/1");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAndDelete_AsAdmin_Work()
    {
        var admin = await _factory.AdminAsync();
        var created = await admin.PostAsJsonAsync("/api/locations", Body("Для видалення"));
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();

        var put = await admin.PutAsJsonAsync($"/api/locations/{id}", Body("Оновлене", 11, 21));
        var delete = await admin.DeleteAsync($"/api/locations/{id}");
        var after = await admin.GetAsync($"/api/locations/{id}");

        Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, after.StatusCode);
    }

    [Fact]
    public async Task GetById_Unknown_ReturnsNotFound()
    {
        var response = await _factory.CreateClient().GetAsync("/api/locations/99999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}