using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AstroPlanner.Tests;

public class VisibilityApiTests : IClassFixture<ApiFactory>
{
    private const string Kyiv = "latitude=50.45&longitude=30.52";
    private const string Tromso = "latitude=69.65&longitude=18.96";

    private readonly ApiFactory _factory;

    public VisibilityApiTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Kyiv_InNovember_HasLongNightAndSeesM31()
    {
        var json = await _factory.CreateClient()
            .GetFromJsonAsync<JsonElement>($"/api/visibility?{Kyiv}&date=2026-11-15");

        var items = json.GetProperty("items");
        var dark = json.GetProperty("darkHours").GetDouble();
        var m31 = items.EnumerateArray().First(i => i.GetProperty("name").GetString() == "M31");

        Assert.Equal(20, items.GetArrayLength());
        Assert.InRange(dark, 10, 15);
        Assert.True(m31.GetProperty("visible").GetBoolean());
        Assert.True(m31.GetProperty("bestAltitudeDegrees").GetDouble() > 70);
    }

    [Fact]
    public async Task Tromso_InJune_HasNoDarkness_AndNothingIsVisible()
    {
        var json = await _factory.CreateClient()
            .GetFromJsonAsync<JsonElement>($"/api/visibility?{Tromso}&date=2026-06-21");

        Assert.Equal(0.0, json.GetProperty("darkHours").GetDouble());
        Assert.All(json.GetProperty("items").EnumerateArray(),
            i => Assert.False(i.GetProperty("visible").GetBoolean()));
    }

    [Fact]
    public async Task Tromso_InDecember_M81IsAlwaysAboveHorizon()
    {
        var json = await _factory.CreateClient()
            .GetFromJsonAsync<JsonElement>($"/api/visibility?{Tromso}&date=2026-12-15&objectId=18");

        var item = json.GetProperty("items")[0];

        Assert.Equal("AlwaysAbove", item.GetProperty("horizon").GetString());
        Assert.True(item.GetProperty("visible").GetBoolean());
    }

    [Theory]
    [InlineData("latitude=95&longitude=30")]
    [InlineData("latitude=50")]
    [InlineData("latitude=50&longitude=200")]
    [InlineData("latitude=50&longitude=30&date=1800-01-01")]
    [InlineData("latitude=50&longitude=30&minAltitude=100")]
    public async Task Visibility_InvalidInput_ReturnsBadRequest(string query)
    {
        var response = await _factory.CreateClient().GetAsync($"/api/visibility?{query}");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Visibility_UnknownObject_ReturnsNotFound()
    {
        var response = await _factory.CreateClient().GetAsync($"/api/visibility?{Kyiv}&objectId=9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Visibility_WithoutDate_UsesToday()
    {
        var response = await _factory.CreateClient().GetAsync($"/api/visibility?{Kyiv}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Curve_Returns144Points()
    {
        var json = await _factory.CreateClient()
            .GetFromJsonAsync<JsonElement>($"/api/visibility/11/curve?{Kyiv}&date=2026-11-15");

        Assert.Equal(144, json.GetProperty("points").GetArrayLength());
        Assert.Equal("M31", json.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Curve_UnknownObject_ReturnsNotFound()
    {
        var response = await _factory.CreateClient().GetAsync($"/api/visibility/9999/curve?{Kyiv}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Curve_MissingCoordinates_ReturnsBadRequest()
    {
        var response = await _factory.CreateClient().GetAsync("/api/visibility/11/curve");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}