using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AstroPlanner.Tests;

public class ObservationsApiTests : IClassFixture<ApiFactory>
{
    private const int M31 = 11;
    private const int Kyiv = 1;

    private readonly ApiFactory _factory;

    public ObservationsApiTests(ApiFactory factory) => _factory = factory;

    private static object Body(int objectId = M31, int locationId = Kyiv, string? notes = "ok", DateTime? at = null) => new
    {
        celestialObjectId = objectId,
        locationId,
        observedAtUtc = at ?? DateTime.UtcNow.AddHours(-2),
        notes
    };

    private static async Task<JsonElement> CreateAsync(HttpClient client, object body)
    {
        var response = await client.PostAsJsonAsync("/api/observations", body);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task Create_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/observations", Body());
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_TakesOwnerFromToken_NotFromBody()
    {
        var user = await _factory.NewUserAsync();
        var me = await user.GetFromJsonAsync<JsonElement>("/api/auth/me");

        var created = await CreateAsync(user, new
        {
            celestialObjectId = M31,
            locationId = Kyiv,
            observedAtUtc = DateTime.UtcNow.AddHours(-1),
            notes = "x",
            userId = 1
        });

        Assert.Equal(me.GetProperty("id").GetInt32(), created.GetProperty("userId").GetInt32());
        Assert.Equal("M31", created.GetProperty("objectName").GetString());
    }

    [Fact]
    public async Task Create_UnknownObject_ReturnsBadRequest()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.PostAsJsonAsync("/api/observations", Body(objectId: 9999));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_UnknownLocation_ReturnsBadRequest()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.PostAsJsonAsync("/api/observations", Body(locationId: 9999));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_FutureDate_ReturnsBadRequest()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.PostAsJsonAsync("/api/observations", Body(at: DateTime.UtcNow.AddYears(1)));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_TooLongNotes_ReturnsBadRequest()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.PostAsJsonAsync("/api/observations", Body(notes: new string('x', 1001)));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task List_UserSeesOnlyOwnRecords_AdminSeesAll()
    {
        var owner = await _factory.NewUserAsync();
        var other = await _factory.NewUserAsync();
        var admin = await _factory.AdminAsync();
        await CreateAsync(owner, Body());

        var ownerList = await owner.GetFromJsonAsync<JsonElement>("/api/observations");
        var otherList = await other.GetFromJsonAsync<JsonElement>("/api/observations");
        var adminList = await admin.GetFromJsonAsync<JsonElement>("/api/observations");

        Assert.Equal(1, ownerList.GetProperty("total").GetInt32());
        Assert.Equal(0, otherList.GetProperty("total").GetInt32());
        Assert.True(adminList.GetProperty("total").GetInt32() >= 1);
    }

    [Fact]
    public async Task OtherUser_CannotReadChangeOrDeleteForeignRecord()
    {
        var owner = await _factory.NewUserAsync();
        var other = await _factory.NewUserAsync();
        var id = (await CreateAsync(owner, Body())).GetProperty("id").GetInt32();

        var get = await other.GetAsync($"/api/observations/{id}");
        var put = await other.PutAsJsonAsync($"/api/observations/{id}", Body(notes: "hack"));
        var delete = await other.DeleteAsync($"/api/observations/{id}");

        Assert.Equal(HttpStatusCode.Forbidden, get.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, put.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, delete.StatusCode);
    }

    [Fact]
    public async Task Owner_CanUpdateAndDelete()
    {
        var owner = await _factory.NewUserAsync();
        var id = (await CreateAsync(owner, Body())).GetProperty("id").GetInt32();

        var put = await owner.PutAsJsonAsync($"/api/observations/{id}", Body(notes: "оновлено"));
        var json = await owner.GetFromJsonAsync<JsonElement>($"/api/observations/{id}");
        var delete = await owner.DeleteAsync($"/api/observations/{id}");
        var after = await owner.GetAsync($"/api/observations/{id}");

        Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);
        Assert.Equal("оновлено", json.GetProperty("notes").GetString());
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, after.StatusCode);
    }

    [Fact]
    public async Task Admin_CanReadForeignRecord()
    {
        var owner = await _factory.NewUserAsync();
        var admin = await _factory.AdminAsync();
        var id = (await CreateAsync(owner, Body())).GetProperty("id").GetInt32();

        var response = await admin.GetAsync($"/api/observations/{id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_Unknown_ReturnsNotFound()
    {
        var user = await _factory.NewUserAsync();
        var response = await user.GetAsync("/api/observations/99999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteObjectUsedInLog_ReturnsConflict()
    {
        var admin = await _factory.AdminAsync();
        var user = await _factory.NewUserAsync();

        var name = "T" + Guid.NewGuid().ToString("N")[..8];
        var objectResponse = await admin.PostAsJsonAsync("/api/objects", new
        {
            name,
            commonName = "Тест",
            type = "Galaxy",
            rightAscensionHours = 1.0,
            declinationDegrees = 2.0,
            magnitude = 10.0
        });
        var objectId = (await objectResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
        await CreateAsync(user, Body(objectId: objectId));

        var delete = await admin.DeleteAsync($"/api/objects/{objectId}");

        Assert.Equal(HttpStatusCode.Conflict, delete.StatusCode);
    }
}