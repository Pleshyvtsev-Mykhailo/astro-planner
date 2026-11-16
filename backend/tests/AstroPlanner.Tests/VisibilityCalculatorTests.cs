using AstroPlanner.Api.Services;
using Xunit;

namespace AstroPlanner.Tests;

public class VisibilityCalculatorTests
{
    [Fact]
    public void WindowStart_IsLocalNoonExpressedInUtc()
    {
        var start = VisibilityCalculator.WindowStartUtc(new DateOnly(2026, 11, 15), 30.0);
        Assert.Equal(new DateTime(2026, 11, 15, 10, 0, 0, DateTimeKind.Utc), start);
    }

    [Fact]
    public void Sample_ReturnsOnePointEveryTenMinutesForOneDay()
    {
        var samples = VisibilityCalculator.Sample(0.71, 41.27, 50.45, 30.52, new DateOnly(2026, 11, 15));
        Assert.Equal(144, samples.Count);
    }

    [Fact]
    public void DarkHours_PolarSummer_IsZero()
    {
        var hours = VisibilityCalculator.DarkHours(69.6492, 18.9553, new DateOnly(2026, 6, 21));
        Assert.Equal(0.0, hours);
    }

    [Fact]
    public void DarkHours_KyivInDecember_IsLong()
    {
        var hours = VisibilityCalculator.DarkHours(50.4501, 30.5234, new DateOnly(2026, 12, 15));
        Assert.InRange(hours, 11.0, 16.0);
    }

    [Fact]
    public void DarkHours_KyivAtSummerSolstice_IsShort()
    {
        var hours = VisibilityCalculator.DarkHours(50.4501, 30.5234, new DateOnly(2026, 6, 21));
        Assert.InRange(hours, 2.5, 5.0);
    }

    [Fact]
    public void Summarize_UsesOnlyDarkSamples()
    {
        var t0 = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var samples = new List<AltitudeSample>
        {
            new(t0, 80, 10),
            new(t0.AddMinutes(10), 30, -20),
            new(t0.AddMinutes(20), 45, -20),
            new(t0.AddMinutes(30), 10, -20)
        };

        var summary = VisibilityCalculator.Summarize(samples, 20);

        Assert.Equal(0.5, summary.DarkHours, 6);
        Assert.Equal(45.0, summary.BestAltitude);
        Assert.Equal(t0.AddMinutes(20), summary.BestTimeUtc);
        Assert.Equal(20.0 / 60.0, summary.HoursAboveMin, 6);
    }

    [Fact]
    public void Summarize_WithoutDarkness_HasNoBestAltitude()
    {
        var t0 = new DateTime(2026, 6, 21, 0, 0, 0, DateTimeKind.Utc);
        var samples = new List<AltitudeSample> { new(t0, 40, 3), new(t0.AddMinutes(10), 41, 4) };

        var summary = VisibilityCalculator.Summarize(samples, 20);

        Assert.Equal(0.0, summary.DarkHours);
        Assert.Null(summary.BestAltitude);
        Assert.Equal(0.0, summary.HoursAboveMin);
    }
}