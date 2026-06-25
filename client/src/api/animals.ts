import type { Animal, AnimalVM } from '../types'

// always send the auth cookie
const withCookie = (extra: RequestInit = {}): RequestInit => ({ credentials: 'include', ...extra })
const json = (body: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function getAllAnimals(): Promise<Animal[]> {
  const result = await fetch('/api/animals/all', withCookie())
  if (!result.ok) throw new Error('Not authorized: API error ' + result.status)
  return result.json()
}

export async function getAnimals(): Promise<Animal[]> {
  const response = await fetch('/api/animals')
  if (!response.ok) throw new Error(`API error ${response.status}`)
  return response.json()
}

export async function getAnimal(id: number): Promise<Animal> {
  const response = await fetch(`/api/animals/${id}`, withCookie())
  if (!response.ok) throw new Error(`Animal with ID ${id} not found: API error ${response.status}`)
  return response.json()
}

export async function createAnimal(animal: AnimalVM): Promise<void> {
  const response = await fetch('/api/animals', withCookie({ method: 'POST', ...json(animal) }))
  if (!response.ok) throw new Error(`Creation of animal with ID ${animal.id} failed: API error ${response.status}`)
}

export async function updateAnimal(id: number, animal: AnimalVM): Promise<void> {
  const response = await fetch(`/api/animals/${id}`, withCookie({ method: 'PUT', ...json(animal) }))
  if (!response.ok) throw new Error(`Update of animal with ID ${id} failed: API error ${response.status}`)
}

export async function deleteAnimal(id: number): Promise<void> {
  const response = await fetch(`/api/animals/${id}`, withCookie({ method: 'DELETE' }))
  if (!response.ok) throw new Error(`Deletion of animal with ID ${id} failed: API error ${response.status}`)
}

export async function togglePublish(id: number): Promise<Animal> {
  const response = await fetch(`/api/animals/${id}/publish`, withCookie({ method: 'POST' }))
  if (!response.ok) throw new Error(`Could not toggle published for animal with ID ${id}: API error ${response.status}`)
  return response.json()
}