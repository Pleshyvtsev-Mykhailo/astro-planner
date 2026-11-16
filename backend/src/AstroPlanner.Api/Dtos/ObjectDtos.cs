using System.ComponentModel.DataAnnotations;
using AstroPlanner.Api.Models;

namespace AstroPlanner.Api.Dtos;

public record ObjectDto(int Id, string Name, string CommonName, ObjectType Type,
    double RightAscensionHours, double DeclinationDegrees, double Magnitude);

public class ObjectRequest
{
    [Required, StringLength(50)]
    public string Name { get; set; } = string.Empty;

    [StringLength(100)]
    public string? CommonName { get; set; }

    [Required, EnumDataType(typeof(ObjectType))]
    public ObjectType? Type { get; set; }

    [Required, Range(0, 24)]
    public double? RightAscensionHours { get; set; }

    [Required, Range(-90, 90)]
    public double? DeclinationDegrees { get; set; }

    [Required, Range(-30, 30)]
    public double? Magnitude { get; set; }
}

public class ObjectQuery : PagedQuery
{
    public string? Search { get; set; }
    public ObjectType? Type { get; set; }
    public double? MinMagnitude { get; set; }
    public double? MaxMagnitude { get; set; }

    [RegularExpression("^(name|magnitude|ra|dec)$")]
    public string? SortBy { get; set; }
}

public static class ObjectMapping
{
    public static ObjectDto ToDto(this CelestialObject o) =>
        new(o.Id, o.Name, o.CommonName, o.Type, o.RightAscensionHours, o.DeclinationDegrees, o.Magnitude);

    public static void ApplyTo(this ObjectRequest r, CelestialObject e)
    {
        e.Name = r.Name.Trim();
        e.CommonName = r.CommonName?.Trim() ?? string.Empty;
        e.Type = r.Type!.Value;
        e.RightAscensionHours = r.RightAscensionHours!.Value;
        e.DeclinationDegrees = r.DeclinationDegrees!.Value;
        e.Magnitude = r.Magnitude!.Value;
    }
}