namespace Api.Models;

public class Animal
{
    public int Id { get; set; }
    public string CommonName { get; set; } = "";
    public string ScientificName { get; set; } = "";
     public AnimalGroup Group { get; set; }
    public string ShortFact { get; set; } = "";
    public bool IsPublished { get; set; }

    public List<AnimalLocation> Locations { get; set; } = [];
    public List<MediaAsset> Media { get; set; } = [];
}