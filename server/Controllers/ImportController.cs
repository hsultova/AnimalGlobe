using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
	// Combined search result: photos/location from iNaturalist, an optional sound from Xeno-canto.
	public sealed class ImportSearchResult
	{
		public required IReadOnlyList<PhotoPreview> Photos { get; init; }
		public SoundPreview? Sound { get; init; }
	}

	// The preview the admin picked, sent back to persist as a draft animal.
	public sealed class ImportRequest
	{
		public string CommonName { get; set; } = "";
		public string ScientificName { get; set; } = "";
		public AnimalGroup Group { get; set; }
		public double Latitude { get; set; }
		public double Longitude { get; set; }
		public string PlaceLabel { get; set; } = "";

		// Photo (from iNaturalist)
		public string PhotoUrl { get; set; } = "";
		public string? PhotoThumbnailUrl { get; set; }
		public string PhotoAttribution { get; set; } = "";
		public string PhotoLicenseCode { get; set; } = "";
		public string PhotoSourceRef { get; set; } = "";

		// Sound (from Xeno-canto) — optional
		public string? SoundUrl { get; set; }
		public string? SoundAttribution { get; set; }
		public string? SoundLicenseCode { get; set; }
		public string? SoundSourceRef { get; set; }
	}

	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class ImportController(INaturalistClient inaturalistClient, XenoCantoClient xenoCantoClient, AppDbContext db) : ControllerBase
	{
		// GET /api/import/search?name=lion — preview candidates from the external APIs.
		[HttpGet("search")]
		public async Task<ActionResult<ImportSearchResult>> Search([FromQuery] string name, CancellationToken ct)
		{
			if (string.IsNullOrWhiteSpace(name))
			{
				return BadRequest("Name is required.");
			}

			var photos = await inaturalistClient.SearchAsync(name, ct);

			// Look up a sound by the scientific name of the best photo result, falling back to the raw term.
			var scientificName = photos.Select(p => p.ScientificName).FirstOrDefault(s => !string.IsNullOrWhiteSpace(s)) ?? name;
			var sound = await xenoCantoClient.GetTopRecordingAsync(scientificName, ct);

			return Ok(new ImportSearchResult { Photos = photos, Sound = sound });
		}

		// POST /api/import — persist the chosen preview as an unpublished draft animal.
		[HttpPost]
		public async Task<IActionResult> Import(ImportRequest request)
		{
			if (string.IsNullOrWhiteSpace(request.PhotoUrl))
			{
				return BadRequest("PhotoUrl is required.");
			}

			var animal = new Animal
			{
				CommonName = request.CommonName,
				ScientificName = request.ScientificName,
				Group = request.Group,
				IsPublished = false,
				Locations =
				{
					new AnimalLocation
					{
						Latitude = request.Latitude,
						Longitude = request.Longitude,
						PlaceLabel = request.PlaceLabel,
					}
				},
				Media =
				{
					new MediaAsset
					{
						Kind = MediaKind.Photo,
						Url = request.PhotoUrl,
						ThumbnailUrl = request.PhotoThumbnailUrl,
						Attribution = request.PhotoAttribution,
						LicenseCode = request.PhotoLicenseCode,
						SourceApi = "inaturalist",
						SourceRef = request.PhotoSourceRef,
					}
				},
			};

			if (!string.IsNullOrWhiteSpace(request.SoundUrl))
			{
				animal.Media.Add(new MediaAsset
				{
					Kind = MediaKind.Sound,
					Url = request.SoundUrl,
					Attribution = request.SoundAttribution ?? "",
					LicenseCode = request.SoundLicenseCode ?? "",
					SourceApi = "xeno-canto",
					SourceRef = request.SoundSourceRef,
				});
			}

			db.Add(animal);
			await db.SaveChangesAsync();

			return CreatedAtAction(nameof(Import), new { id = animal.Id }, new { animal.Id });
		}
	}
}
