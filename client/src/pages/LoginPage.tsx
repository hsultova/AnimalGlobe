import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../api/auth"

export default function LoginPage() {
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
      setError('Login failed: Invalid email or password')
    }
  }
  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 320, margin: '80px auto', display: 'grid', gap: 8, fontFamily: 'system-ui' }}>
      <h1>Admin login</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Log in</button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </form>
  )
}