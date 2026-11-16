namespace AstroPlanner.Api.Services;

public record JwtSettings(string Issuer, string Audience, string Secret, int ExpiresMinutes)
{
    public static JwtSettings FromConfiguration(IConfiguration config)
    {
        var secret = config["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
        {
            throw new InvalidOperationException(
                "Налаштуйте Jwt:Secret (мінімум 32 символи), наприклад змінною середовища Jwt__Secret.");
        }

        return new JwtSettings(
            config["Jwt:Issuer"] ?? "AstroPlanner",
            config["Jwt:Audience"] ?? "AstroPlannerClients",
            secret,
            int.TryParse(config["Jwt:ExpiresMinutes"], out var minutes) ? minutes : 60);
    }
}