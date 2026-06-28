using Api.Data;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Controllers
{
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
	public class ImportController(INaturalistClient inaturalistClient, XenoCantoClient xenoCantoClient, AppDbContext db, IMemoryCache cache) : ControllerBase
	{
		// External previews change rarely; cache them so repeat searches are instant.
		private static readonly MemoryCacheEntryOptions CacheOptions = new()
		{
			AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
		};

		// GET /api/import/search?name=lion — photo candidates from iNaturalist.
		// Optional admin filters (perPage, qualityGrade, sort, group) tune the search.
		// Sound is fetched separately (GET /sound) so it never blocks the photo grid.
		[HttpGet("search")]
		public async Task<ActionResult<IReadOnlyList<PhotoPreview>>> Search(
			[FromQuery] string name,
			[FromQuery] int? perPage,
			[FromQuery] string? qualityGrade,
			[FromQuery] string? sort,
			[FromQuery] AnimalGroup? group,
			CancellationToken ct)
		{
			if (string.IsNullOrWhiteSpace(name))
			{
				return BadRequest("Name is required.");
			}

			var options = new SearchOptions
			{
				PerPage = perPage ?? 20,
				QualityGrade = string.IsNullOrWhiteSpace(qualityGrade) ? "research" : qualityGrade,
				Sort = string.IsNullOrWhiteSpace(sort) ? "popular" : sort,
				IconicTaxon = group is { } g ? INaturalistClient.IconicTaxonFor(g) : null,
			};

			// Fold the options into the cache key so distinct configurations don't
			// collide on the same cached result.
			var cacheKey = $"inat:{name.Trim().ToLowerInvariant()}|{options.ClampedPerPage}|" +
				$"{options.QualityGrade.ToLowerInvariant()}|{options.Sort.ToLowerInvariant()}|{options.IconicTaxon}";

			var photos = await cache.GetOrCreateAsync(
				cacheKey,
				entry =>
				{
					entry.SetOptions(CacheOptions);
					return inaturalistClient.SearchAsync(name, options, ct);
				});

			return Ok(photos ?? Array.Empty<PhotoPreview>());
		}

		// GET /api/import/sound?scientificName=Panthera%20leo — optional sound for a species.
		[HttpGet("sound")]
		public async Task<ActionResult<SoundPreview?>> Sound([FromQuery] string scientificName, CancellationToken ct)
		{
			if (string.IsNullOrWhiteSpace(scientificName))
			{
				return Ok(null);
			}

			var sound = await cache.GetOrCreateAsync(
				$"xc:{scientificName.Trim().ToLowerInvariant()}",
				entry =>
				{
					entry.SetOptions(CacheOptions);
					return xenoCantoClient.GetTopRecordingAsync(scientificName, ct);
				});

			return Ok(sound);
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
