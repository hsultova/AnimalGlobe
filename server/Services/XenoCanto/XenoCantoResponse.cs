using System.Text.Json.Serialization;

namespace Api.Services.XenoCanto
{
	// Raw shapes from Xeno-canto GET /api/3/recordings.
	// Only the fields we consume — System.Text.Json ignores the rest.
	internal sealed class XenoCantoResponse
	{
		public int NumRecordings { get; set; }
		public List<XenoCantoRecording>? Recordings { get; set; }
	}

	internal sealed class XenoCantoRecording
	{
		public string? Id { get; set; }
		public string? Gen { get; set; }          // genus
		public string? Sp { get; set; }           // species
		public string? En { get; set; }           // English common name
		public string? Rec { get; set; }          // recordist
		public string? Cnt { get; set; }          // country
		public string? Loc { get; set; }          // location label
		public string? File { get; set; }         // audio download URL
		public string? Lic { get; set; }          // license URL
		public string? Q { get; set; }            // quality rating (A best .. E worst)
		public string? Length { get; set; }       // duration mm:ss

		[JsonPropertyName("file-name")]
		public string? FileName { get; set; }
	}
}
