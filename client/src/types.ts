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
  soundAttribution?: string
}

// --- Import preview (iNaturalist + Xeno-canto) ---

// Admin-tunable search filters, sent to GET /api/import/search.
export interface SearchOptions {
  perPage?: number
  qualityGrade?: 'research' | 'needs_id' | 'casual' | 'any'
  sort?: 'popular' | 'recent'
  group?: AnimalGroup
}

export interface PhotoPreview {
  thumbnailUrl: string
  mediumUrl: string
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