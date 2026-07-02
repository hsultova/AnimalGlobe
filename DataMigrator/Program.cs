using Api.Data;
using Microsoft.EntityFrameworkCore;

var sqlitePath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "server", "animalglobe.db"));
if (!File.Exists(sqlitePath))
	throw new FileNotFoundException($"SQLite source database not found at: {sqlitePath}");

var sqliteOptions = new DbContextOptionsBuilder<AppDbContext>()
	.UseSqlite($"Data Source={sqlitePath}")
	.Options;

var pgOptions = new DbContextOptionsBuilder<AppDbContext>()
	.UseNpgsql("Host=localhost;Database=animalglobe;Username=devuser;Password=devpas;Port=5432;SslMode=Prefer;Trust Server Certificate=true")
	.Options;

using var source = new AppDbContext(sqliteOptions);
using var target = new AppDbContext(pgOptions);

// Ensure the target Postgres schema exists before inserting.
target.Database.Migrate();

var animals = source.Animals
	.AsNoTracking()
	.Include(a => a.Locations)
	.Include(a => a.Media)
	.ToList();

foreach (var animal in animals)
{
	animal.Id = 0;
	foreach (var loc in animal.Locations) { loc.Id = 0; loc.AnimalId = 0; }
	foreach (var m in animal.Media) { m.Id = 0; m.AnimalId = 0; }
}

target.Animals.AddRange(animals);
target.SaveChanges();
Console.WriteLine($"Migrated {animals.Count} animals.");