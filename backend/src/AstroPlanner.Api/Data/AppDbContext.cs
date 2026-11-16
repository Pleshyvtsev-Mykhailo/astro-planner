using AstroPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace AstroPlanner.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<CelestialObject> CelestialObjects => Set<CelestialObject>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<ObservationLog> ObservationLogs => Set<ObservationLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CelestialObject>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(50);
            e.Property(x => x.CommonName).HasMaxLength(100);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(30);
            e.HasIndex(x => x.Name).IsUnique();
            e.HasIndex(x => x.Type);
        });

        modelBuilder.Entity<Location>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<AppUser>(e =>
        {
            e.Property(x => x.Username).IsRequired().HasMaxLength(50);
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Role).IsRequired().HasMaxLength(20);
            e.HasIndex(x => x.Username).IsUnique();
        });

        modelBuilder.Entity<ObservationLog>(e =>
        {
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.HasOne(x => x.User).WithMany(u => u.Observations)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.CelestialObject).WithMany(o => o.Observations)
                .HasForeignKey(x => x.CelestialObjectId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Location).WithMany(l => l.Observations)
                .HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.UserId, x.ObservedAtUtc });
        });
    }
}