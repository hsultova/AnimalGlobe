using Api.Models;

namespace Api.ViewModels;

public class AnimalViewModel
{
	public int Id { get; set; }
	public string CommonName { get; set; } = "";
	public string ScientificName { get; set; } = "";
	public AnimalGroup Group { get; set; }
	public string ShortFact { get; set; } = "";

	public double Latitude { get; set; }
	public double Longitude { get; set; }
	public string PlaceLabel { get; set; } = "";

	public string? PhotoUrl { get; set; }
	public string? PhotoAttribution { get; set; }
	public string? SoundUrl { get; set; }
	public string? SoundAttribution { get; set; }
}