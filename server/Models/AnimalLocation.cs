namespace Api.Models;

public class AnimalLocation
{
	public int Id { get; set; }

	// foreign key
	public int AnimalId { get; set; }
	public Animal Animal { get; set; } = null!;

	public double Latitude { get; set; }
	public double Longitude { get; set; }
	public string PlaceLabel { get; set; } = "";
}