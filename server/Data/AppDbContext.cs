using Microsoft.EntityFrameworkCore;
using Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<IdentityUser>(options)
{
	public DbSet<Animal> Animals => Set<Animal>();
	public DbSet<AnimalLocation> AnimalLocations => Set<AnimalLocation>();
	public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
}