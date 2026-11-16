namespace AstroPlanner.Api.Services;

public enum HorizonKind
{
    RisesAndSets,
    AlwaysAbove,
    NeverRises
}

public static class AstroMath
{
    private const double DegToRad = Math.PI / 180.0;
    private const double RadToDeg = 180.0 / Math.PI;

    public static double Normalize360(double degrees)
    {
        var r = degrees % 360.0;
        return r < 0 ? r + 360.0 : r;
    }

    public static double JulianDate(DateTime utc)
    {
        var u = utc.Kind == DateTimeKind.Local ? utc.ToUniversalTime() : utc;
        return u.Ticks / (double)TimeSpan.TicksPerDay + 1721425.5;
    }

    public static double GreenwichSiderealDegrees(double julianDate)
    {
        var d = julianDate - 2451545.0;
        var t = d / 36525.0;
        var gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - t * t * t / 38710000.0;
        return Normalize360(gmst);
    }

    public static double AltitudeDegrees(double raHours, double decDegrees, double latDegrees, double lonDegrees, DateTime utc)
    {
        var lst = Normalize360(GreenwichSiderealDegrees(JulianDate(utc)) + lonDegrees);
        var hourAngle = (lst - raHours * 15.0) * DegToRad;
        var dec = decDegrees * DegToRad;
        var lat = latDegrees * DegToRad;
        var sinAlt = Math.Sin(dec) * Math.Sin(lat) + Math.Cos(dec) * Math.Cos(lat) * Math.Cos(hourAngle);
        return Math.Asin(Math.Clamp(sinAlt, -1.0, 1.0)) * RadToDeg;
    }

    public static double SunAltitudeDegrees(double latDegrees, double lonDegrees, DateTime utc)
    {
        var n = JulianDate(utc) - 2451545.0;
        var meanLongitude = Normalize360(280.460 + 0.9856474 * n);
        var meanAnomaly = Normalize360(357.528 + 0.9856003 * n) * DegToRad;
        var eclipticLongitude = (meanLongitude + 1.915 * Math.Sin(meanAnomaly) + 0.020 * Math.Sin(2 * meanAnomaly)) * DegToRad;
        var obliquity = (23.439 - 0.0000004 * n) * DegToRad;

        var rightAscension = Math.Atan2(Math.Cos(obliquity) * Math.Sin(eclipticLongitude), Math.Cos(eclipticLongitude));
        var declination = Math.Asin(Math.Sin(obliquity) * Math.Sin(eclipticLongitude));
        var raHours = Normalize360(rightAscension * RadToDeg) / 15.0;

        return AltitudeDegrees(raHours, declination * RadToDeg, latDegrees, lonDegrees, utc);
    }

    public static HorizonKind ClassifyHorizon(double decDegrees, double latDegrees)
    {
        var x = -Math.Tan(latDegrees * DegToRad) * Math.Tan(decDegrees * DegToRad);
        if (x <= -1.0) return HorizonKind.AlwaysAbove;
        if (x >= 1.0) return HorizonKind.NeverRises;
        return HorizonKind.RisesAndSets;
    }
}