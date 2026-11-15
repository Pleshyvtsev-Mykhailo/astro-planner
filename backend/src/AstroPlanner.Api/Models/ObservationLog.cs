namespace AstroPlanner.Api.Models;

public class ObservationLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int CelestialObjectId { get; set; }
    public CelestialObject CelestialObject { get; set; } = null!;
    public int LocationId { get; set; }
    public Location Location { get; set; } = null!;
    public DateTime ObservedAtUtc { get; set; }
    public string Notes { get; set; } = string.Empty;
}