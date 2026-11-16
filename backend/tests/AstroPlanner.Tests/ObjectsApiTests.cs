using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AstroPlanner.Tests;

public class ObjectsApiTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public ObjectsApiTests(ApiFactory factory) => _factory = factory;

    private static string UniqueName() => "T" + Guid.NewGuid().ToString("N")[..8];

    private static object Body(string name, double ra = 1.0, string commonName = "Тест") => new
    {
        name,
        commonName,
        type = "Galaxy",
        rightAscensionHours = ra,
        declinationDegrees = 2.0,
        magnitude = 10.0
    };

    private static async Task<int> CreateAsync(HttpClient admin, string name)
    {
        var response = await admin.PostAsJsonAsync("/api/objects", Body(name));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        return created.GetProperty("id").GetInt32();
    }

    [Fact]
    public async Task GetAll_ReturnsSeededObjects()
    {
        var json = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/objects");
        Assert.True(json.GetProperty("total").GetInt32() >= 20);
        Assert.Equal(20, json.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task GetAll_FilterByType_ReturnsOnlyThatType()
    {
        var json = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/objects?type=Galaxy&pageSize=100");
        var items = json.GetProperty("items").EnumerateArray().ToList();

        Assert.NotEmpty(items);
        Assert.All(items, i => Assert.Equal("Galaxy", i.GetProperty("type").GetString()));
    }

    [Fact]
    public async Task GetAll_SortByMagnitude_StartsWithBrightestObject()
    {
        var json = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/objects?sortBy=magnitude");
        Assert.Equal("M45", json.GetProperty("items")[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task GetAll_Search_FindsByName()
    {
        var json = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/objects?search=M31");
        var items = json.GetProperty("items").EnumerateArray().ToList();
        Assert.Contains(items, i => i.GetProperty("name").GetString() == "M31");
    }

    [Theory]
    [InlineData("/api/objects?pageSize=1000")]
    [InlineData("/api/objects?page=0")]
    [InlineData("/api/objects?sortBy=hack")]
    public async Task GetAll_InvalidQuery_ReturnsBadRequest(string url)
    {
        var response = await _factory.CreateClient().GetAsync(url);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_Existing_ReturnsObject()
    {
        var json = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/objects/11");
        Assert.Equal("M31", json.GetProperty("name").GetString());
    }

    [Fact]
    public async Task GetById_Unknown_ReturnsNotFound()
    {
        var response = await _factory.CreateClient().GetAsync("/api/objects/99999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/objects", Body(UniqueName()));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_AsRegularUser_ReturnsForbidden()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.PostAsJsonAsync("/api/objects", Body(UniqueName()));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_AsAdmin_Succeeds_AndDuplicateIsConflict()
    {
        var admin = await _factory.AdminAsync();
        var name = UniqueName();

        var first = await admin.PostAsJsonAsync("/api/objects", Body(name));
        var second = await admin.PostAsJsonAsync("/api/objects", Body(name));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Create_InvalidRightAscension_ReturnsBadRequest()
    {
        var admin = await _factory.AdminAsync();
        var response = await admin.PostAsJsonAsync("/api/objects", Body(UniqueName(), ra: 25));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_MissingFields_ReturnsBadRequest()
    {
        var admin = await _factory.AdminAsync();
        var response = await admin.PostAsJsonAsync("/api/objects", new { name = UniqueName() });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_AsAdmin_ChangesObject()
    {
        var admin = await _factory.AdminAsync();
        var name = UniqueName();
        var id = await CreateAsync(admin, name);

        var put = await admin.PutAsJsonAsync($"/api/objects/{id}", Body(name, commonName: "Оновлено"));
        var json = await admin.GetFromJsonAsync<JsonElement>($"/api/objects/{id}");

        Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);
        Assert.Equal("Оновлено", json.GetProperty("commonName").GetString());
    }

    [Fact]
    public async Task Update_Unknown_ReturnsNotFound()
    {
        var admin = await _factory.AdminAsync();
        var response = await admin.PutAsJsonAsync("/api/objects/99999", Body(UniqueName()));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AsAdmin_RemovesObject()
    {
        var admin = await _factory.AdminAsync();
        var id = await CreateAsync(admin, UniqueName());

        var delete = await admin.DeleteAsync($"/api/objects/{id}");
        var after = await admin.GetAsync($"/api/objects/{id}");

        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, after.StatusCode);
    }

    [Fact]
    public async Task Delete_Unknown_ReturnsNotFound()
    {
        var admin = await _factory.AdminAsync();
        var response = await admin.DeleteAsync("/api/objects/99999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}