using Api.Models;
using Microsoft.AspNetCore.WebUtilities;
using System.Text.Json;

namespace Api.Services
{
	public sealed class PhotoPreview
	{
		public required string ThumbnailUrl { get; init; }   // square — marker/grid
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

		public async Task<IReadOnlyList<PhotoPreview>> SearchAsync(string name, CancellationToken ct = default)
		{
			var query = new Dictionary<string, string?>
			{
				["taxon_name"] = name,
				["photos"] = "true",
				["geo"] = "true",
				["quality_grade"] = "research",
				["photo_license"] = "cc0,cc-by,cc-by-nc",
				["per_page"] = "20",
				["order_by"] = "votes",
				["order"] = "desc",
			};
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
