import type { ImportRequest, PhotoPreview, SoundPreview } from '../types'

// always send the auth cookie
const withCookie = (extra: RequestInit = {}): RequestInit => ({ credentials: 'include', ...extra })
const json = (body: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function searchImport(name: string): Promise<PhotoPreview[]> {
  const response = await fetch(`/api/import/search?name=${encodeURIComponent(name)}`, withCookie())
  if (!response.ok) throw new Error(`Import search failed: API error ${response.status}`)
  return response.json()
}

// Optional sound for a species; fetched separately so it never blocks the photo grid.
export async function fetchSound(scientificName: string): Promise<SoundPreview | null> {
  const response = await fetch(`/api/import/sound?scientificName=${encodeURIComponent(scientificName)}`, withCookie())
  if (!response.ok) throw new Error(`Sound lookup failed: API error ${response.status}`)
  return response.json()
}

export async function importAnimal(payload: ImportRequest): Promise<{ id: number }> {
  const response = await fetch('/api/import', withCookie({ method: 'POST', ...json(payload) }))
  if (!response.ok) throw new Error(`Import failed: API error ${response.status}`)
  return response.json()
}
