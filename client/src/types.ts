export type AnimalGroup = | 'Mammal' | 'Bird' | 'Reptile' | 'Amphibian' | 'Fish' | 'Insect' | 'Other';

export interface Animal {
  id: number;
  commonName: string;
  scientificName: string;
  group: AnimalGroup;
  shortFact: string;
  latitude: number;
  longitude: number;
  placeLabel: string;
  photoUrl?: string;
  photoAttribution?: string;
  soundUrl?: string;
  soundAttribution?: string;
  isPublished: boolean;
}

export interface AnimalVM {
  id?: number
  commonName: string
  group: AnimalGroup
  scientificName: string
  shortFact: string
  latitude: number
  longitude: number
  placeLabel: string
  photoUrl?: string
  soundUrl?: string  
}