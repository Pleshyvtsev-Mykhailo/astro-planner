namespace AstroPlanner.Api.Models;

public class CelestialObject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CommonName { get; set; } = string.Empty;
    public ObjectType Type { get; set; }
    public double RightAscensionHours { get; set; }
    public double DeclinationDegrees { get; set; }
    public double Magnitude { get; set; }
    public List<ObservationLog> Observations { get; set; } = new();
}