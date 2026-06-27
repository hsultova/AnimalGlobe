using System.Linq.Expressions;
using Api.Data;
using Api.Models;
using Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AnimalsController(AppDbContext db) : ControllerBase
{
	private readonly AppDbContext _db = db;

	private static readonly Expression<Func<Animal, AnimalViewModel>> animalVM = a => new AnimalViewModel
	{
		Id = a.Id,
		CommonName = a.CommonName,
		ScientificName = a.ScientificName,
		Group = a.Group,
		ShortFact = a.ShortFact,
		Latitude = a.Locations.Select(l => l.Latitude).FirstOrDefault(),
		Longitude = a.Locations.Select(l => l.Longitude).FirstOrDefault(),
		PlaceLabel = a.Locations.Select(l => l.PlaceLabel).FirstOrDefault() ?? "",
		PhotoUrl = a.Media.Where(m => m.Kind == MediaKind.Photo).Select(m => m.Url).FirstOrDefault(),
		PhotoAttribution = a.Media.Where(m => m.Kind == MediaKind.Photo).Select(m => m.Attribution).FirstOrDefault(),
		SoundUrl = a.Media.Where(m => m.Kind == MediaKind.Sound).Select(m => m.Url).FirstOrDefault(),
        SoundAttribution = a.Media.Where(m => m.Kind == MediaKind.Sound).Select(m => m.Attribution).FirstOrDefault(),
        IsPublished = a.IsPublished
    };

	// GET: api/animals — only published animals, for public consumption
	[HttpGet]
	[AllowAnonymous]
	public async Task<ActionResult<IEnumerable<AnimalViewModel>>> GetPublished()
	{
		var animals = await _db.Animals.Where(a => a.IsPublished).Select(animalVM).ToListAsync();
		return Ok(animals);
	}

	// GET /api/animals/all — all animals, for admin use
	[HttpGet("all")]
	public async Task<ActionResult<IEnumerable<AnimalViewModel>>> GetAllAnimals()
	{
		var animals = await _db.Animals.Select(animalVM).ToListAsync();
		return Ok(animals);
	}

	// GET /api/animals/{id} — get a single animal by ID, for admin use
	[HttpGet("{id:int}")]
	public async Task<ActionResult<AnimalViewModel>> GetById(int id)
	{
		var animal = await _db.Animals.Where(a => a.Id == id).Select(animalVM).FirstOrDefaultAsync();
		return animal is null ? NotFound() : animal;
	}

	// POST /api/animals — create as a DRAFT (unpublished)
	[HttpPost]
	public async Task<IActionResult> Create(AnimalViewModel animalVM)
	{
		var animal = new Animal
		{
			CommonName = animalVM.CommonName,
			ScientificName = animalVM.ScientificName,
			Group = animalVM.Group,
			ShortFact = animalVM.ShortFact,
			IsPublished = false,
			Locations = { new AnimalLocation { Latitude = animalVM.Latitude,
				Longitude = animalVM.Longitude,
				PlaceLabel = animalVM.PlaceLabel
			}},
		};

		if (!string.IsNullOrWhiteSpace(animalVM.PhotoUrl))
		{
			animal.Media.Add(new MediaAsset { Kind = MediaKind.Photo, Url = animalVM.PhotoUrl, SourceApi = "manual" });
		}

		if (!string.IsNullOrWhiteSpace(animalVM.SoundUrl))
		{
			animal.Media.Add(new MediaAsset { Kind = MediaKind.Sound, Url = animalVM.SoundUrl, SourceApi = "manual" });
		}

		_db.Add(animal);
		await _db.SaveChangesAsync();

		return Ok(new { animal.Id });
	}

	// POST /api/animals/{id}/publish — toggle the published status of an animal
	[HttpPost("{id:int}/publish")]
	public async Task<IActionResult> TogglePublish(int id)
	{
		var animal = await _db.Animals.FindAsync(id);
		if (animal is null)
		{
			return NotFound();
		}
		animal.IsPublished = !animal.IsPublished;

		await _db.SaveChangesAsync();
		return Ok(new { animal.Id, animal.IsPublished });
	}

	// DELETE /api/animals/{id} — delete an animal
	[HttpDelete("{id:int}")]
	public async Task<IActionResult> Delete(int id)
	{
		var animal = await _db.Animals.FindAsync(id);
		if (animal is null)
		{
			return NotFound();
		}

		_db.Animals.Remove(animal);
		await _db.SaveChangesAsync();
		return NoContent();
	}

	// PUT /api/admin/animals/{id} — update an existing animal
	[HttpPut("{id:int}")]
	public async Task<IActionResult> Update(int id, AnimalViewModel animalVm)
	{
		var animal = await _db.Animals
			.Include(a => a.Locations)
			.Include(a => a.Media)
			.FirstOrDefaultAsync(a => a.Id == id);
		if (animal is null)
		{
			return NotFound();
		}
		animal.CommonName = animalVm.CommonName;
		animal.ScientificName = animalVm.ScientificName;
		animal.Group = animalVm.Group;
		animal.ShortFact = animalVm.ShortFact;

		var location = animal.Locations.FirstOrDefault();
		if (location is null)
		{
			animal.Locations.Add(
				new AnimalLocation { Latitude = animalVm.Latitude, Longitude = animalVm.Longitude, PlaceLabel = animalVm.PlaceLabel });
		}
		else
		{
			location.Latitude = animalVm.Latitude;
			location.Longitude = animalVm.Longitude;
			location.PlaceLabel = animalVm.PlaceLabel;
		}

		// Sync media so a photo/sound (e.g. a sound fetched later from Xeno-canto)
		// can be added, updated, or cleared from the edit form.
		UpsertMedia(animal, MediaKind.Photo, animalVm.PhotoUrl, null);
		UpsertMedia(animal, MediaKind.Sound, animalVm.SoundUrl, animalVm.SoundAttribution);

		await _db.SaveChangesAsync();
		return NoContent();
	}

	// Add, update, or remove the single photo/sound asset to match the submitted URL.
	private static void UpsertMedia(Animal animal, MediaKind kind, string? url, string? attribution)
	{
		var existing = animal.Media.FirstOrDefault(m => m.Kind == kind);

		if (string.IsNullOrWhiteSpace(url))
		{
			if (existing is not null)
			{
				animal.Media.Remove(existing);
			}
			return;
		}

		if (existing is null)
		{
			animal.Media.Add(new MediaAsset
			{
				Kind = kind,
				Url = url,
				Attribution = attribution ?? "",
				SourceApi = "manual",
			});
		}
		else
		{
			existing.Url = url;
			// Keep the original attribution unless a new one was supplied.
			if (attribution is not null)
			{
				existing.Attribution = attribution;
			}
		}
	}
}