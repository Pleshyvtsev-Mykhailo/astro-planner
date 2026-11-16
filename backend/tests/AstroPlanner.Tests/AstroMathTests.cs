using AstroPlanner.Api.Services;
using Xunit;

namespace AstroPlanner.Tests;

public class AstroMathTests
{
    [Fact]
    public void JulianDate_AtJ2000_Is2451545()
    {
        var jd = AstroMath.JulianDate(new DateTime(2000, 1, 1, 12, 0, 0, DateTimeKind.Utc));
        Assert.Equal(2451545.0, jd, 6);
    }

    [Fact]
    public void SiderealTime_AtJ2000_IsKnownConstant()
    {
        Assert.Equal(280.46061837, AstroMath.GreenwichSiderealDegrees(2451545.0), 6);
    }

    [Theory]
    [InlineData(2026, 3, 1, 0)]
    [InlineData(2026, 6, 15, 7)]
    [InlineData(2026, 11, 15, 19)]
    public void Polaris_AltitudeIsCloseToLatitude(int year, int month, int day, int hour)
    {
        const double latitude = 50.45;
        var time = new DateTime(year, month, day, hour, 0, 0, DateTimeKind.Utc);
        var altitude = AstroMath.AltitudeDegrees(2.53, 89.26, latitude, 30.52, time);
        Assert.InRange(altitude, latitude - 1.0, latitude + 1.0);
    }

    [Fact]
    public void ObjectOnMeridianWithDeclinationEqualToLatitude_IsAtZenith()
    {
        const double latitude = 50.45;
        const double longitude = 30.52;
        var time = new DateTime(2026, 11, 15, 20, 0, 0, DateTimeKind.Utc);
        var lst = AstroMath.Normalize360(AstroMath.GreenwichSiderealDegrees(AstroMath.JulianDate(time)) + longitude);

        var altitude = AstroMath.AltitudeDegrees(lst / 15.0, latitude, latitude, longitude, time);

        Assert.True(altitude > 89.99);
    }

    [Fact]
    public void Sun_AtSummerNoonInKyiv_IsHigh()
    {
        var time = new DateTime(2026, 6, 21, 9, 58, 0, DateTimeKind.Utc);
        var altitude = AstroMath.SunAltitudeDegrees(50.45, 30.52, time);
        Assert.InRange(altitude, 62.0, 64.0);
    }

    [Fact]
    public void Sun_AtWinterMidnightInKyiv_IsFarBelowHorizon()
    {
        var time = new DateTime(2026, 12, 21, 21, 57, 0, DateTimeKind.Utc);
        var altitude = AstroMath.SunAltitudeDegrees(50.45, 30.52, time);
        Assert.True(altitude < -60.0);
    }

    [Theory]
    [InlineData(69.6492, 69.0653, HorizonKind.AlwaysAbove)]
    [InlineData(69.6492, -5.3911, HorizonKind.RisesAndSets)]
    [InlineData(69.6492, -24.3867, HorizonKind.NeverRises)]
    [InlineData(50.45, 22.0145, HorizonKind.RisesAndSets)]
    [InlineData(0.0, 80.0, HorizonKind.RisesAndSets)]
    public void ClassifyHorizon_GivesExpectedKind(double latitude, double declination, HorizonKind expected)
    {
        Assert.Equal(expected, AstroMath.ClassifyHorizon(declination, latitude));
    }
}