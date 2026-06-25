import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAllAnimals, togglePublish, deleteAnimal} from '../api/animals'
import { logout } from '../api/auth'
import type { Animal} from '../types'

export default function AnimalPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const navigate = useNavigate()

  async function load() { setAnimals(await getAllAnimals()) }
  useEffect(() => { load() }, [])

  async function onToggle(id: number) { await togglePublish(id); await load() }
  async function onDelete(id: number) {
    if (!confirm('Delete this animal?')) return
    await deleteAnimal(id); await load()
  }
  async function onLogout() { await logout(); navigate('/login') }

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Animals</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/animals/new"><button>+ New animal</button></Link>
          <button onClick={onLogout}>Log out</button>
        </div>
      </header>

      <table width="100%" cellPadding={6}>
        <thead>
          <tr><th align="left">Name</th><th>Group</th><th align="left">Place</th><th>Published</th><th></th></tr>
        </thead>
        <tbody>
          {animals.map((a) => (
            <tr key={a.id}>
              <td>{a.commonName}</td>
              <td align="center">{a.group}</td>
              <td>{a.placeLabel}</td>
              <td align="center">{a.isPublished ? '✅' : '—'}</td>
              <td align="right">
                <Link to={`/animals/${a.id}/edit`}><button>Edit</button></Link>{' '}
                <button onClick={() => onToggle(a.id)}>{a.isPublished ? 'Unpublish' : 'Publish'}</button>{' '}
                <button onClick={() => onDelete(a.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}