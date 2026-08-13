using AnimalGlobe.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AnimalGlobe.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<IdentityUser>(options)
{
	public DbSet<Animal> Animals => Set<Animal>();
	public DbSet<AnimalLocation> AnimalLocations => Set<AnimalLocation>();
	public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
}