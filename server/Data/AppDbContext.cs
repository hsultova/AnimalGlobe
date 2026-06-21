using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Animal> Animals => Set<Animal>();
    public DbSet<AnimalLocation> AnimalLocations => Set<AnimalLocation>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
}