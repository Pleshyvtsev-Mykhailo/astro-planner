using AstroPlanner.Api.Models;

namespace AstroPlanner.Api.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (!db.CelestialObjects.Any())
        {
            db.CelestialObjects.AddRange(
                Obj("M1", "Крабоподібна туманність", ObjectType.SupernovaRemnant, 5.5755, 22.0145, 8.4),
                Obj("M3", "Кульове скупчення в Гончих Псах", ObjectType.GlobularCluster, 13.7032, 28.3772, 6.2),
                Obj("M8", "Туманність Лагуна", ObjectType.Nebula, 18.0603, -24.3867, 6.0),
                Obj("M11", "Скупчення Дика Качка", ObjectType.OpenCluster, 18.8514, -6.2700, 6.3),
                Obj("M13", "Скупчення Геракла", ObjectType.GlobularCluster, 16.6949, 36.4603, 5.8),
                Obj("M16", "Туманність Орел", ObjectType.Nebula, 18.3133, -13.8167, 6.4),
                Obj("M17", "Туманність Омега", ObjectType.Nebula, 18.3406, -16.1767, 6.0),
                Obj("M20", "Туманність Трифід", ObjectType.Nebula, 18.0397, -23.0300, 6.3),
                Obj("M22", "Кульове скупчення в Стрільці", ObjectType.GlobularCluster, 18.6066, -23.9047, 5.1),
                Obj("M27", "Туманність Гантель", ObjectType.PlanetaryNebula, 19.9934, 22.7211, 7.5),
                Obj("M31", "Галактика Андромеди", ObjectType.Galaxy, 0.7123, 41.2692, 3.4),
                Obj("M33", "Галактика Трикутника", ObjectType.Galaxy, 1.5642, 30.6603, 5.7),
                Obj("M42", "Туманність Оріона", ObjectType.Nebula, 5.5881, -5.3911, 4.0),
                Obj("M44", "Скупчення Ясла", ObjectType.OpenCluster, 8.6733, 19.6667, 3.7),
                Obj("M45", "Плеяди", ObjectType.OpenCluster, 3.7900, 24.1167, 1.6),
                Obj("M51", "Галактика Вир", ObjectType.Galaxy, 13.4979, 47.1953, 8.4),
                Obj("M57", "Туманність Кільце", ObjectType.PlanetaryNebula, 18.8931, 33.0292, 8.8),
                Obj("M81", "Галактика Боде", ObjectType.Galaxy, 9.9259, 69.0653, 6.9),
                Obj("M82", "Галактика Сигара", ObjectType.Galaxy, 9.9313, 69.6794, 8.4),
                Obj("M104", "Галактика Сомбреро", ObjectType.Galaxy, 12.6665, -11.6231, 8.0));
        }

        if (!db.Locations.Any())
        {
            db.Locations.AddRange(
                new Location { Name = "Київ", Latitude = 50.4501, Longitude = 30.5234 },
                new Location { Name = "Львів", Latitude = 49.8397, Longitude = 24.0297 },
                new Location { Name = "Тромсе (Норвегія)", Latitude = 69.6492, Longitude = 18.9553 });
        }

        db.SaveChanges();
    }

    private static CelestialObject Obj(string name, string commonName, ObjectType type,
        double raHours, double decDeg, double magnitude) => new()
        {
            Name = name,
            CommonName = commonName,
            Type = type,
            RightAscensionHours = raHours,
            DeclinationDegrees = decDeg,
            Magnitude = magnitude
        };
}