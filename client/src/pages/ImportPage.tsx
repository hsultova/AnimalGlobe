import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { searchImport, fetchSound, importAnimal } from '../api/import'
import type { PhotoPreview, SoundPreview } from '../types'

export default function ImportPage() {
  const { t } = useTranslation()
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
      setError(t('import.searchFailed'))
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
      setError(t('import.importFailed'))
      setImportingRef(null)
    }
  }

  return (
    // The global `overflow: hidden` (for the 3D globe) blocks page scroll, so
    // this page owns its own scroll container.
    <div style={{ height: '100vh', overflowY: 'auto' }}>
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('import.title')}</h1>
        <button onClick={() => navigate('/animals')}>{t('import.back')}</button>
      </header>

      <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('import.placeholder')}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={loading}>{loading ? t('import.searching') : t('import.search')}</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {photos && (
        <>
          {soundLoading ? (
            <p style={{ color: '#666' }}>{t('import.loadingSound')}</p>
          ) : sound ? (
            <div style={{ margin: '8px 0 20px' }}>
              <strong>{t('import.soundLabel')}</strong> — {sound.attribution}
              <audio controls src={sound.url} style={{ display: 'block', marginTop: 6, width: '100%' }} />
            </div>
          ) : (
            <p style={{ color: '#666' }}>{t('import.noSound')}</p>
          )}

          {photos.length === 0 ? (
            <p style={{ color: '#666' }}>{t('import.noPhotos')}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {photos.map((photo) => (
                <div key={photo.sourceRef} style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={photo.mediumUrl} alt={photo.commonName} loading="lazy" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: 10 }}>
                    <div style={{ fontWeight: 600 }}>{photo.commonName || t('import.noCommonName')}</div>
                    <div style={{ fontStyle: 'italic', color: '#555' }}>{photo.scientificName}</div>
                    <div style={{ fontSize: 12, color: '#777', margin: '4px 0' }}>{photo.placeLabel}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{photo.attribution}</div>
                    <button
                      onClick={() => onPick(photo, sound)}
                      disabled={importingRef !== null}
                      style={{ marginTop: 8, width: '100%' }}
                    >
                      {importingRef === photo.sourceRef ? t('import.importing') : t('import.importDraft')}
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
