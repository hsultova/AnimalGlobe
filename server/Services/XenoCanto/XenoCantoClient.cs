using Api.Configuration;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace Api.Services
{
	public sealed class SoundPreview
	{
		public required string Url { get; init; }            // audio file URL
		public required string Attribution { get; init; }    // recordist + Xeno-canto credit
		public string LicenseCode { get; init; } = "";
		public required string SourceRef { get; init; }      // Xeno-canto recording id
	}

	public sealed class XenoCantoClient
	{
		private static readonly JsonSerializerOptions JsonOptions = new()
		{
			PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
			PropertyNameCaseInsensitive = true,
		};

		private readonly HttpClient _httpClient;
		private readonly string _apiKey;
		private readonly ILogger<XenoCantoClient> _logger;

		public XenoCantoClient(HttpClient httpClient, IOptions<XenoCantoOptions> options, ILogger<XenoCantoClient> logger)
		{
			_httpClient = httpClient;
			_apiKey = options.Value.ApiKey;
			_logger = logger;
		}

		// Best-effort: returns the top recording for a species, or null when no key is
		// configured, the species has no recordings, or the API call fails. Sound is an
		// optional enrichment — import must still succeed without it.
		public async Task<SoundPreview?> GetTopRecordingAsync(string scientificName, CancellationToken ct = default)
		{
			if (string.IsNullOrWhiteSpace(_apiKey))
			{
				_logger.LogInformation("Xeno-canto API key not configured; skipping sound lookup.");
				return null;
			}
			if (string.IsNullOrWhiteSpace(scientificName))
			{
				return null;
			}

			var query = new Dictionary<string, string?>
			{
				["query"] = BuildSpeciesQuery(scientificName),
				["key"] = _apiKey,
				["per_page"] = "1",
			};
			var url = QueryHelpers.AddQueryString("recordings", query);

			try
			{
				var response = await _httpClient.GetFromJsonAsync<XenoCantoResponse>(url, JsonOptions, ct);
				var recording = response?.Recordings?.FirstOrDefault();
				if (recording?.File is null)
				{
					return null;
				}

				return new SoundPreview
				{
					Url = NormalizeUrl(recording.File),
					Attribution = $"{recording.Rec ?? "Unknown"} // xeno-canto.org (XC{recording.Id})",
					LicenseCode = recording.Lic ?? "",
					SourceRef = recording.Id ?? "",
				};
			}
			catch (Exception ex) when (ex is HttpRequestException or JsonException or TaskCanceledException)
			{
				_logger.LogWarning(ex, "Xeno-canto lookup failed for {ScientificName}; continuing without sound.", scientificName);
				return null;
			}
		}

		// Xeno-canto v3 requires tagged search terms. Split "Genus species" into gen:/sp: tags.
		private static string BuildSpeciesQuery(string scientificName)
		{
			var parts = scientificName.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
			var genus = parts.Length > 0 ? $"gen:\"{parts[0]}\"" : "";
			var species = parts.Length > 1 ? $" sp:\"{parts[1]}\"" : "";
			return (genus + species).Trim();
		}

		// Xeno-canto returns protocol-relative URLs ("//xeno-canto.org/.../download").
		private static string NormalizeUrl(string url) =>
			url.StartsWith("//") ? "https:" + url : url;
	}
}
