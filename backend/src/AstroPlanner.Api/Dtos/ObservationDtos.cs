using System.ComponentModel.DataAnnotations;

namespace AstroPlanner.Api.Dtos;

public record ObservationDto(int Id, int UserId, int CelestialObjectId, string ObjectName,
    int LocationId, string LocationName, DateTime ObservedAtUtc, string Notes);

public class ObservationRequest
{
    [Required]
    public int? CelestialObjectId { get; set; }

    [Required]
    public int? LocationId { get; set; }

    [Required]
    public DateTime? ObservedAtUtc { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class ObservationQuery : PagedQuery
{
    public int? ObjectId { get; set; }
    public int? LocationId { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}