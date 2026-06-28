using Api.Models;
using Microsoft.AspNetCore.WebUtilities;
using System.Text.Json;

namespace Api.Services
{
	// Admin-tunable search parameters, set in the import UI before searching.
	// Defaults reproduce the previous hardcoded behaviour.
	public sealed class SearchOptions
	{
		// How many candidates to fetch. Clamped to [1, 50] — bigger pages mean a
		// markedly heavier iNaturalist payload (the nested photo/taxon arrays add up).
		public int PerPage { get; init; } = 20;

		// research | needs_id | casual | any. "any" drops the grade filter entirely.
		public string QualityGrade { get; init; } = "research";

		// "popular": only faved observations, default order (best photos, lighter payload).
		// "recent": newest observations first (order_by=observed_on). See SearchAsync for why
		// we avoid order_by=votes.
		public string Sort { get; init; } = "popular";

		// Optional iNaturalist iconic-taxon class name (e.g. "Mammalia", "Aves") to
		// disambiguate names that collide across groups. Null/empty = no group filter.
		public string? IconicTaxon { get; init; }

		public int ClampedPerPage => Math.Clamp(PerPage, 1, 50);
	}

	public sealed class PhotoPreview
	{
		public required string ThumbnailUrl { get; init; }   // square crop — stored marker
		public required string MediumUrl { get; init; }      // 500px — crisp grid preview
		public required string LargeUrl { get; init; }       // for the animal card
		public required string Attribution { get; init; }
		public string LicenseCode { get; init; } = "";
		public double Latitude { get; init; }
		public double Longitude { get; init; }
		public string PlaceLabel { get; init; } = "";
		public string CommonName { get; init; } = "";
		public string ScientificName { get; init; } = "";
		public AnimalGroup Group { get; init; }
		public required string SourceRef { get; init; }      // iNat observation id
	}

	public sealed class INaturalistClient
	{
		private static readonly JsonSerializerOptions JsonOptions = new()
		{
			PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
			PropertyNameCaseInsensitive = true,
		};

		private readonly HttpClient _httpClient;
		public INaturalistClient(HttpClient httpClient)
		{
			_httpClient = httpClient;
		}

		public async Task<IReadOnlyList<PhotoPreview>> SearchAsync(string name, SearchOptions? options = null, CancellationToken ct = default)
		{
			options ??= new SearchOptions();

			var query = new Dictionary<string, string?>
			{
				["taxon_name"] = name,
				["photos"] = "true",
				["geo"] = "true",
				["photo_license"] = "cc0,cc-by,cc-by-nc",
				["per_page"] = options.ClampedPerPage.ToString(),
				["order"] = "desc",
			};

			// "any" means no grade filter at all; otherwise pass the admin's choice through.
			if (!string.Equals(options.QualityGrade, "any", StringComparison.OrdinalIgnoreCase))
			{
				query["quality_grade"] = options.QualityGrade;
			}

			// Sort. "popular=true" keeps only observations that have been faved
			// (~6s / ~2MB) and uses default ordering — the best photos for the least
			// payload. "recent" orders by observation date instead. Avoid order_by=votes:
			// sorting by faves drags in the most-engaged observations' huge nested arrays
			// (~17MB / ~20s, which tripped the HttpClient retry timeout).
			if (string.Equals(options.Sort, "recent", StringComparison.OrdinalIgnoreCase))
			{
				query["order_by"] = "observed_on";
			}
			else
			{
				query["popular"] = "true";
			}

			// Optional group filter to disambiguate names that collide across taxa.
			if (!string.IsNullOrWhiteSpace(options.IconicTaxon))
			{
				query["iconic_taxa"] = options.IconicTaxon;
			}

			var url = QueryHelpers.AddQueryString("observations", query);

			var response = await _httpClient.GetFromJsonAsync<INatSearchResponse>(url, JsonOptions, ct);
			if (response?.Results is null)
			{
				return Array.Empty<PhotoPreview>();
			}

			var previews = new List<PhotoPreview>(response.Results.Count);
			foreach (var obs in response.Results)
			{
				var photo = obs.Photos?.FirstOrDefault();
				if (photo?.Url is null)
				{
					continue;
				}
				// GeoJSON order is [longitude, latitude] — the reverse of "lat,lng".
				if (obs.Geojson?.Coordinates is not { Count: 2 } coords)
				{
					continue;
				}
				var lng = coords[0];
				var lat = coords[1];

				previews.Add(new PhotoPreview
				{
					ThumbnailUrl = photo.Url,                         // square
					MediumUrl = ResizePhoto(photo.Url, "medium"),
					LargeUrl = ResizePhoto(photo.Url, "large"),
					Attribution = photo.Attribution ?? "Unknown",
					LicenseCode = photo.LicenseCode ?? "",
					Latitude = lat,
					Longitude = lng,
					PlaceLabel = obs.PlaceGuess ?? "",
					CommonName = obs.Taxon?.PreferredCommonName ?? "",
					ScientificName = obs.Taxon?.Name ?? "",
					Group = MapGroup(obs.Taxon?.IconicTaxonName),
					SourceRef = obs.Id.ToString(),
				});
			}

			return previews;
		}

		// .../photos/12345/square.jpg(?cachebuster) -> .../photos/12345/large.jpg(?...)
		private static string ResizePhoto(string squareUrl, string size) =>
			squareUrl.Replace("square.", size + ".");

		// Our coarse AnimalGroup -> iNaturalist "iconic taxon" class name(s) for the
		// iconic_taxa filter. Returns null for groups iNaturalist doesn't model 1:1.
		public static string? IconicTaxonFor(AnimalGroup group) => group switch
		{
			AnimalGroup.Mammal => "Mammalia",
			AnimalGroup.Bird => "Aves",
			AnimalGroup.Reptile => "Reptilia",
			AnimalGroup.Amphibian => "Amphibia",
			AnimalGroup.Fish => "Actinopterygii,Chondrichthyes",
			AnimalGroup.Insect => "Insecta",
			_ => null,
		};

		// iNaturalist "iconic taxon" class name -> our coarse AnimalGroup.
		private static AnimalGroup MapGroup(string? iconicTaxonName) => iconicTaxonName switch
		{
			"Mammalia" => AnimalGroup.Mammal,
			"Aves" => AnimalGroup.Bird,
			"Reptilia" => AnimalGroup.Reptile,
			"Amphibia" => AnimalGroup.Amphibian,
			"Actinopterygii" or "Chondrichthyes" => AnimalGroup.Fish,
			"Insecta" => AnimalGroup.Insect,
			_ => AnimalGroup.Other,
		};
	}
}
