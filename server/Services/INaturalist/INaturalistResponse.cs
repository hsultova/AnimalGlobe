namespace Api.Services
{
	// Raw shapes from iNaturalist GET /v1/observations.
	// Only the fields we consume — System.Text.Json ignores the rest.
	internal sealed class INatSearchResponse
	{
		public List<INatObservation>? Results { get; set; }
		public int TotalResults { get; set; }
	}

	internal sealed class INatObservation
	{
		public long Id { get; set; }
		public string? Location { get; set; }        // "latitude,longitude" string form
		public INatGeojson? Geojson { get; set; }     // coordinates are [longitude, latitude]
		public string? PlaceGuess { get; set; }
		public INatTaxon? Taxon { get; set; }
		public List<INatPhoto>? Photos { get; set; }
	}

	internal sealed class INatGeojson
	{
		public string? Type { get; set; }
		public List<double>? Coordinates { get; set; }   // [longitude, latitude]
	}

	internal sealed class INatTaxon
	{
		// scientific name
		public string? Name { get; set; }
		public string? PreferredCommonName { get; set; }
		public string? IconicTaxonName { get; set; }   // e.g. "Mammalia", "Aves" — maps to AnimalGroup
	}

	internal sealed class INatPhoto
	{
		public long Id { get; set; }
		public string? Url { get; set; }             // the SQUARE thumbnail
		public string? Attribution { get; set; }
		public string? LicenseCode { get; set; }
	}
}
