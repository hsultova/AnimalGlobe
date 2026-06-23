import type { Animal } from '../types'

export async function getAnimals(): Promise<Animal[]> {
  const response = await fetch('/api/animals')
  if (!response.ok) throw new Error(`API error ${response.status}`)
  return response.json()
}