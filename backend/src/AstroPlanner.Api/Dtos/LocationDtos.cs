using System.ComponentModel.DataAnnotations;
using AstroPlanner.Api.Models;

namespace AstroPlanner.Api.Dtos;

public record LocationDto(int Id, string Name, double Latitude, double Longitude);

public class LocationRequest
{
    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, Range(-90, 90)]
    public double? Latitude { get; set; }

    [Required, Range(-180, 180)]
    public double? Longitude { get; set; }
}

public class LocationQuery : PagedQuery
{
    public string? Search { get; set; }

    [RegularExpression("^(name|latitude|longitude)$")]
    public string? SortBy { get; set; }
}

public static class LocationMapping
{
    public static LocationDto ToDto(this Location l) => new(l.Id, l.Name, l.Latitude, l.Longitude);

    public static void ApplyTo(this LocationRequest r, Location e)
    {
        e.Name = r.Name.Trim();
        e.Latitude = r.Latitude!.Value;
        e.Longitude = r.Longitude!.Value;
    }
}