namespace Api.Models;

public class MediaAsset
{
	public int Id { get; set; }
	public int AnimalId { get; set; }
	public Animal Animal { get; set; } = null!;

	// Photo or Sound
	public MediaKind Kind { get; set; }
	public string Url { get; set; } = "";
	public string? ThumbnailUrl { get; set; }
	public string Attribution { get; set; } = "";
	public string LicenseCode { get; set; } = "";
	public string SourceApi { get; set; } = "";
	public string? SourceRef { get; set; }
}