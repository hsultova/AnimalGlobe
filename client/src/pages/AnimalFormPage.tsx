import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAnimal, createAnimal, updateAnimal } from '../api/animals'
import { fetchSound } from '../api/import'
import type { AnimalGroup, AnimalVM } from '../types'

const GROUPS: AnimalGroup[] = ['Mammal', 'Bird', 'Reptile', 'Amphibian', 'Fish', 'Insect', 'Other']
const EMPTY: AnimalVM = {
  commonName: '', scientificName: '', group: 'Mammal',
  shortFact: '', latitude: 0, longitude: 0, placeLabel: '', photoUrl: '', soundUrl: '', soundAttribution: ''
}

export default function AnimalFormPage() {
  const { id } = useParams()            
  const isEdit = id != null
  const [form, setForm] = useState<AnimalVM>(EMPTY)
  const [error, setError] = useState('')
  const [soundFetching, setSoundFetching] = useState(false)
  const [soundStatus, setSoundStatus] = useState('')
  const navigate = useNavigate()

  // when editing, load the animal and map read-shape → input-shape
  useEffect(() => {
    if (!isEdit) return
    getAnimal(Number(id))
      .then((animal) => setForm({
        commonName: animal.commonName,
        scientificName: animal.scientificName,
        group: animal.group,
        shortFact: animal.shortFact,
        latitude: animal.latitude ?? 0,
        longitude: animal.longitude ?? 0,
        placeLabel: animal.placeLabel ?? '',
        photoUrl: animal.photoUrl ?? '',
        soundUrl: animal.soundUrl ?? '',
        soundAttribution: animal.soundAttribution ?? ''
      }))
      .catch(() => setError('Could not load this animal.'))
  }, [id, isEdit])

  function set<K extends keyof AnimalVM>(key: K, value: AnimalVM[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Look up a recording for the current scientific name and fill the sound fields.
  // Persisted only when the form is saved.
  async function onFetchSound() {
    const scientificName = form.scientificName.trim()
    if (!scientificName) return
    setSoundStatus('')
    setSoundFetching(true)
    try {
      const sound = await fetchSound(scientificName)
      if (sound) {
        set('soundUrl', sound.url)
        set('soundAttribution', sound.attribution)
        setSoundStatus('Found a recording — Save changes to keep it.')
      } else {
        setSoundStatus('No recording found for this species.')
      }
    } catch {
      setSoundStatus('Sound lookup failed.')
    } finally {
      setSoundFetching(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (isEdit) await updateAnimal(Number(id), form)
      else await createAnimal(form)
      navigate('/animals')
    } catch {
      setError('Save failed.')
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 480, margin: '40px auto', display: 'grid', gap: 10, fontFamily: 'system-ui' }}>
      <h1>{isEdit ? 'Edit animal' : 'New animal'}</h1>

      <label>Common name
        <input value={form.commonName} onChange={(e) => set('commonName', e.target.value)} required />
      </label>
      <label>Scientific name
        <input value={form.scientificName} onChange={(e) => set('scientificName', e.target.value)} />
      </label>
      <label>Group
        <select value={form.group} onChange={(e) => set('group', e.target.value as AnimalGroup)}>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>
      <label>Fun fact
        <input value={form.shortFact} onChange={(e) => set('shortFact', e.target.value)} />
      </label>

      <div style={{ display: 'flex', gap: 10 }}>
        <label style={{ flex: 1 }}>Latitude
          <input type="number" step="any" value={form.latitude}
                 onChange={(e) => set('latitude', e.target.valueAsNumber)} />
        </label>
        <label style={{ flex: 1 }}>Longitude
          <input type="number" step="any" value={form.longitude}
                 onChange={(e) => set('longitude', e.target.valueAsNumber)} />
        </label>
      </div>

      <label>Place label
        <input value={form.placeLabel} onChange={(e) => set('placeLabel', e.target.value)} />
      </label>
      <label>Photo URL
        <input value={form.photoUrl} onChange={(e) => set('photoUrl', e.target.value)} />
      </label>
      <label>Sound URL
        <input value={form.soundUrl} onChange={(e) => set('soundUrl', e.target.value)} />
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: -4 }}>
        <button type="button" onClick={onFetchSound} disabled={soundFetching || !form.scientificName.trim()}>
          {soundFetching ? 'Fetching…' : 'Fetch sound from Xeno-canto'}
        </button>
        {soundStatus && <span style={{ fontSize: 12, color: '#666' }}>{soundStatus}</span>}
      </div>
      {form.soundUrl && (
        <div>
          <audio controls src={form.soundUrl} style={{ width: '100%' }} />
          {form.soundAttribution && (
            <div style={{ fontSize: 11, color: '#999' }}>{form.soundAttribution}</div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit">{isEdit ? 'Save changes' : 'Create'}</button>
        <button type="button" onClick={() => navigate('/animals')}>Cancel</button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </form>
  )
}