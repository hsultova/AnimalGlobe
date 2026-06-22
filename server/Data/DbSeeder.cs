using Api.Models;

namespace Api.Data;

public static class DbSeeder
{
	public static void Seed(AppDbContext db)
	{
		if (db.Animals.Any())
		{
			return; // already seeded
		}

		var animals = new List<Animal>
		{
			new() {
				CommonName = "Lion", ScientificName = "Panthera leo",
				Group = AnimalGroup.Mammal,
				ShortFact = "A lion's roar can be heard up to 8 kilometres away!",
				IsPublished = true,
				Locations = { new AnimalLocation { Latitude = -2.333, Longitude = 34.833, PlaceLabel = "Serengeti, Tanzania" } },
				Media =
				{
					new MediaAsset { Kind = MediaKind.Photo, Url = "https://picsum.photos/seed/lion/600/400",
									 Attribution = "Placeholder", LicenseCode = "CC0", SourceApi = "placeholder" },
					new MediaAsset { Kind = MediaKind.Sound, Url = "",
									 Attribution = "Placeholder", LicenseCode = "CC0", SourceApi = "placeholder" },
				}
			},
			new() {
				CommonName = "Emperor Penguin", ScientificName = "Aptenodytes forsteri",
				Group = AnimalGroup.Bird,
				ShortFact = "Emperor penguins huddle together to stay warm in the freezing cold.",
				IsPublished = true,
				Locations = { new AnimalLocation { Latitude = -77.5, Longitude = 166.0, PlaceLabel = "Ross Sea, Antarctica" } },
				Media = { new MediaAsset { Kind = MediaKind.Photo, Url = "https://picsum.photos/seed/penguin/600/400",
										   Attribution = "Placeholder", LicenseCode = "CC0", SourceApi = "placeholder" } }
			},
			new() {
				CommonName = "Red Kangaroo", ScientificName = "Osphranter rufus",
				Group = AnimalGroup.Mammal,
				ShortFact = "Kangaroos can hop faster than 50 kilometres per hour!",
				IsPublished = true,
				Locations = { new AnimalLocation { Latitude = -25.0, Longitude = 133.0, PlaceLabel = "Outback, Australia" } },
				Media = { new MediaAsset { Kind = MediaKind.Photo, Url = "https://picsum.photos/seed/kangaroo/600/400",
										   Attribution = "Placeholder", LicenseCode = "CC0", SourceApi = "placeholder" } }
			},
			new() {
				CommonName = "Galápagos Giant Tortoise", ScientificName = "Chelonoidis niger",
				Group = AnimalGroup.Reptile,
				ShortFact = "Giant tortoises can live for more than 100 years.",
				IsPublished = true,
				Locations = { new AnimalLocation { Latitude = -0.95, Longitude = -90.97, PlaceLabel = "Galápagos Islands" } },
				Media = { new MediaAsset { Kind = MediaKind.Photo, Url = "https://picsum.photos/seed/tortoise/600/400",
										   Attribution = "Placeholder", LicenseCode = "CC0", SourceApi = "placeholder" } }
			},
			new() {
                // NOT published on purpose — proves the safety gate works
                CommonName = "Giant Panda", ScientificName = "Ailuropoda melanoleuca",
				Group = AnimalGroup.Mammal,
				ShortFact = "Pandas eat bamboo for up to 14 hours a day.",
				IsPublished = false,
				Locations = { new AnimalLocation { Latitude = 30.75, Longitude = 103.0, PlaceLabel = "Sichuan, China" } },
				Media = { new MediaAsset { Kind = MediaKind.Photo, Url = "https://picsum.photos/seed/panda/600/400",
										   Attribution = "Placeholder", LicenseCode = "CC0", SourceApi = "placeholder" } }
			},
		};

		db.Animals.AddRange(animals);
		db.SaveChanges();
	}
}