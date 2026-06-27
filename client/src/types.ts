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

// --- Import preview (iNaturalist + Xeno-canto) ---

export interface PhotoPreview {
  thumbnailUrl: string
  largeUrl: string
  attribution: string
  licenseCode: string
  latitude: number
  longitude: number
  placeLabel: string
  commonName: string
  scientificName: string
  group: AnimalGroup
  sourceRef: string
}

export interface SoundPreview {
  url: string
  attribution: string
  licenseCode: string
  sourceRef: string
}

export interface ImportSearchResult {
  photos: PhotoPreview[]
  sound: SoundPreview | null
}

export interface ImportRequest {
  commonName: string
  scientificName: string
  group: AnimalGroup
  latitude: number
  longitude: number
  placeLabel: string

  photoUrl: string
  photoThumbnailUrl?: string
  photoAttribution: string
  photoLicenseCode: string
  photoSourceRef: string

  soundUrl?: string
  soundAttribution?: string
  soundLicenseCode?: string
  soundSourceRef?: string
}