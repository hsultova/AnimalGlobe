import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { login } from "../api/auth"
import LanguageSwitcher from "../components/LanguageSwitcher"

export default function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('admin@animalglobe.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/animals')
    }
    catch (err) {
      setError(t('login.failed'))
    }
  }
  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 320, margin: '80px auto', display: 'grid', gap: 8, fontFamily: 'system-ui' }}>
      <div style={{ justifySelf: 'end' }}><LanguageSwitcher /></div>
      <h1>{t('login.title')}</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('login.email')} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('login.password')} />
      <button type="submit">{t('login.submit')}</button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </form>
  )
}