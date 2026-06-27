import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAllAnimals, togglePublish, deleteAnimal} from '../api/animals'
import { logout } from '../api/auth'
import type { Animal} from '../types'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function AnimalPage() {
  const { t } = useTranslation()
  const [animals, setAnimals] = useState<Animal[]>([])
  const navigate = useNavigate()

  async function load() { setAnimals(await getAllAnimals()) }
  useEffect(() => { load() }, [])

  async function onToggle(id: number) { await togglePublish(id); await load() }
  async function onDelete(id: number) {
    if (!confirm(t('animals.confirmDelete'))) return
    await deleteAnimal(id); await load()
  }
  async function onLogout() { await logout(); navigate('/login') }

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('animals.title')}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LanguageSwitcher />
          <Link to="/animals/new"><button>{t('animals.new')}</button></Link>
          <Link to="/animals/import"><button>{t('animals.import')}</button></Link>
          <button onClick={onLogout}>{t('animals.logout')}</button>
        </div>
      </header>

      <table width="100%" cellPadding={6}>
        <thead>
          <tr><th align="left">{t('animals.colName')}</th><th>{t('animals.colGroup')}</th><th align="left">{t('animals.colPlace')}</th><th>{t('animals.colPublished')}</th><th></th></tr>
        </thead>
        <tbody>
          {animals.map((a) => (
            <tr key={a.id}>
              <td>{a.commonName}</td>
              <td align="center">{t(`groups.${a.group}`)}</td>
              <td>{a.placeLabel}</td>
              <td align="center">{a.isPublished ? '✅' : '—'}</td>
              <td align="right">
                <Link to={`/animals/${a.id}/edit`}><button>{t('animals.edit')}</button></Link>{' '}
                <button onClick={() => onToggle(a.id)}>{a.isPublished ? t('animals.unpublish') : t('animals.publish')}</button>{' '}
                <button onClick={() => onDelete(a.id)}>{t('animals.delete')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}