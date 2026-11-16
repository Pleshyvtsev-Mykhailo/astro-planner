using AstroPlanner.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace AstroPlanner.Api.Data;

public static class UserSeeder
{
    public static void EnsureAdmin(AppDbContext db, string? adminPassword)
    {
        if (string.IsNullOrWhiteSpace(adminPassword)) return;
        if (db.Users.Any(u => u.Role == "Admin")) return;

        var admin = new AppUser { Username = "admin", Role = "Admin" };
        admin.PasswordHash = new PasswordHasher<AppUser>().HashPassword(admin, adminPassword);
        db.Users.Add(admin);
        db.SaveChanges();
    }
}