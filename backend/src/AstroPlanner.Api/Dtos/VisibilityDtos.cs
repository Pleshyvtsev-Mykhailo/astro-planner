using System.ComponentModel.DataAnnotations;
using AstroPlanner.Api.Services;

namespace AstroPlanner.Api.Dtos;

public class CoordinateQuery
{
    [Required, Range(-90.0, 90.0)]
    public double? Latitude { get; set; }

    [Required, Range(-180.0, 180.0)]
    public double? Longitude { get; set; }

    public DateOnly? Date { get; set; }
}

public class VisibilityQuery : CoordinateQuery
{
    [Range(0.0, 90.0)]
    public double MinAltitude { get; set; } = 20;

    public int? ObjectId { get; set; }
}

public record VisibilityItem(int ObjectId, string Name, string CommonName, HorizonKind Horizon,
    bool Visible, double? BestAltitudeDegrees, DateTime? BestTimeUtc, double HoursAboveMinAltitude);

public record VisibilityResponse(double Latitude, double Longitude, DateOnly Date,
    double MinAltitudeDegrees, double DarkHours, List<VisibilityItem> Items);

public record CurvePoint(DateTime TimeUtc, double AltitudeDegrees, double SunAltitudeDegrees);

public record CurveResponse(int ObjectId, string Name, List<CurvePoint> Points);