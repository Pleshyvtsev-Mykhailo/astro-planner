namespace AstroPlanner.Api.Services;

public record AltitudeSample(DateTime TimeUtc, double AltitudeDegrees, double SunAltitudeDegrees);

public record NightSummary(double DarkHours, double? BestAltitude, DateTime? BestTimeUtc, double HoursAboveMin);

public static class VisibilityCalculator
{
    public const double DarknessSunAltitude = -12.0;
    public const int StepMinutes = 10;
    public const int SampleCount = 24 * 60 / StepMinutes;

    public static DateTime WindowStartUtc(DateOnly date, double lonDegrees)
    {
        var noonUtc = date.ToDateTime(new TimeOnly(12, 0), DateTimeKind.Utc);
        return noonUtc.AddHours(-lonDegrees / 15.0);
    }

    public static List<AltitudeSample> Sample(double raHours, double decDegrees, double latDegrees, double lonDegrees, DateOnly date)
    {
        var start = WindowStartUtc(date, lonDegrees);
        var list = new List<AltitudeSample>(SampleCount);
        for (var i = 0; i < SampleCount; i++)
        {
            var t = start.AddMinutes(i * StepMinutes);
            list.Add(new AltitudeSample(
                t,
                AstroMath.AltitudeDegrees(raHours, decDegrees, latDegrees, lonDegrees, t),
                AstroMath.SunAltitudeDegrees(latDegrees, lonDegrees, t)));
        }
        return list;
    }

    public static NightSummary Summarize(List<AltitudeSample> samples, double minAltitude)
    {
        var dark = samples.Where(s => s.SunAltitudeDegrees < DarknessSunAltitude).ToList();
        if (dark.Count == 0) return new NightSummary(0, null, null, 0);

        var best = dark.MaxBy(s => s.AltitudeDegrees)!;
        var above = dark.Count(s => s.AltitudeDegrees >= minAltitude);
        return new NightSummary(
            dark.Count * StepMinutes / 60.0,
            best.AltitudeDegrees,
            best.TimeUtc,
            above * StepMinutes / 60.0);
    }

    public static double DarkHours(double latDegrees, double lonDegrees, DateOnly date)
    {
        var start = WindowStartUtc(date, lonDegrees);
        var dark = 0;
        for (var i = 0; i < SampleCount; i++)
        {
            var sun = AstroMath.SunAltitudeDegrees(latDegrees, lonDegrees, start.AddMinutes(i * StepMinutes));
            if (sun < DarknessSunAltitude) dark++;
        }
        return dark * StepMinutes / 60.0;
    }
}