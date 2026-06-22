using Api.Data;
using Api.Models;
using Api.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AnimalsController(AppDbContext db) : ControllerBase
{
	private readonly AppDbContext _db = db;

    // GET: api/<AnimalsController>
    [HttpGet]
	public async Task<ActionResult<IEnumerable<AnimalViewModel>>> GetAnimals()
	{
		var animals = await _db.Animals
			.Where(animal => animal.IsPublished)
			.Select(animal => new AnimalViewModel
			{
				Id = animal.Id,
				CommonName = animal.CommonName,
				ScientificName = animal.ScientificName,
				Group = animal.Group,
				ShortFact = animal.ShortFact,

				Latitude = animal.Locations.Select(location => (double?)location.Latitude).FirstOrDefault(),
				Longitude = animal.Locations.Select(location => (double?)location.Longitude).FirstOrDefault(),
				PlaceLabel = animal.Locations.Select(location => location.PlaceLabel).FirstOrDefault(),

				PhotoUrl = animal.Media.Where(media => media.Kind == MediaKind.Photo)
										 .Select(media => media.Url).FirstOrDefault(),
				PhotoAttribution = animal.Media.Where(media => media.Kind == MediaKind.Photo)
												 .Select(media => media.Attribution).FirstOrDefault(),
				SoundUrl = animal.Media.Where(media => media.Kind == MediaKind.Sound)
										 .Select(media => media.Url).FirstOrDefault(),
				SoundAttribution = animal.Media.Where(media => media.Kind == MediaKind.Sound)
												 .Select(media => media.Attribution).FirstOrDefault(),
			})
			.ToListAsync();

		return Ok(animals);
	}
}