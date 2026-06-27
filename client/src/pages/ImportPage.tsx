import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchImport, fetchSound, importAnimal } from '../api/import'
import type { PhotoPreview, SoundPreview } from '../types'

export default function ImportPage() {
  const [name, setName] = useState('')
  const [photos, setPhotos] = useState<PhotoPreview[] | null>(null)
  const [sound, setSound] = useState<SoundPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [soundLoading, setSoundLoading] = useState(false)
  const [importingRef, setImportingRef] = useState<string | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)
    setPhotos(null)
    setSound(null)
    try {
      const found = await searchImport(name.trim())
      setPhotos(found)

      // Load the optional sound in the background so the photo grid never waits on it.
      const scientificName = found.find((p) => p.scientificName)?.scientificName ?? name.trim()
      setSoundLoading(true)
      fetchSound(scientificName)
        .then(setSound)
        .catch(() => setSound(null))
        .finally(() => setSoundLoading(false))
    } catch {
      setError('Search failed.')
    } finally {
      setLoading(false)
    }
  }

  async function onPick(photo: PhotoPreview, sound: SoundPreview | null) {
    setError('')
    setImportingRef(photo.sourceRef)
    try {
      const { id } = await importAnimal({
        commonName: photo.commonName,
        scientificName: photo.scientificName,
        group: photo.group,
        latitude: photo.latitude,
        longitude: photo.longitude,
        placeLabel: photo.placeLabel,
        photoUrl: photo.largeUrl,
        photoThumbnailUrl: photo.thumbnailUrl,
        photoAttribution: photo.attribution,
        photoLicenseCode: photo.licenseCode,
        photoSourceRef: photo.sourceRef,
        soundUrl: sound?.url,
        soundAttribution: sound?.attribution,
        soundLicenseCode: sound?.licenseCode,
        soundSourceRef: sound?.sourceRef,
      })
      navigate(`/animals/${id}/edit`)
    } catch {
      setError('Import failed.')
      setImportingRef(null)
    }
  }

  return (
    // The global `overflow: hidden` (for the 3D globe) blocks page scroll, so
    // this page owns its own scroll container.
    <div style={{ height: '100vh', overflowY: 'auto' }}>
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Import from API</h1>
        <button onClick={() => navigate('/animals')}>Back to animals</button>
      </header>

      <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Species name, e.g. lion"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {photos && (
        <>
          {soundLoading ? (
            <p style={{ color: '#666' }}>Loading sound…</p>
          ) : sound ? (
            <div style={{ margin: '8px 0 20px' }}>
              <strong>Sound</strong> — {sound.attribution}
              <audio controls src={sound.url} style={{ display: 'block', marginTop: 6, width: '100%' }} />
            </div>
          ) : (
            <p style={{ color: '#666' }}>No sound recording available for this species.</p>
          )}

          {photos.length === 0 ? (
            <p style={{ color: '#666' }}>No photos found. Try another name.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {photos.map((photo) => (
                <div key={photo.sourceRef} style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={photo.mediumUrl} alt={photo.commonName} loading="lazy" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: 10 }}>
                    <div style={{ fontWeight: 600 }}>{photo.commonName || '(no common name)'}</div>
                    <div style={{ fontStyle: 'italic', color: '#555' }}>{photo.scientificName}</div>
                    <div style={{ fontSize: 12, color: '#777', margin: '4px 0' }}>{photo.placeLabel}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{photo.attribution}</div>
                    <button
                      onClick={() => onPick(photo, sound)}
                      disabled={importingRef !== null}
                      style={{ marginTop: 8, width: '100%' }}
                    >
                      {importingRef === photo.sourceRef ? 'Importing…' : 'Import as draft'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
    </div>
  )
}
