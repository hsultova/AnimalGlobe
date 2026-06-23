export type AnimalGroup = | 'Mammals' | 'Birds' | 'Reptiles' | 'Amphibians' | 'Fish' | 'Insects' | 'Other';

export interface Animal {
  id: string;
  commonName: string;
  scientificName: string;
  group: AnimalGroup;
  shortFact: string;
  latitude: number;
  longitude: number;
  placelabel: string;
  photoUrl: string;
  photoAttribution: string;
  soundUrl: string;
  soundAttribution: string;
}