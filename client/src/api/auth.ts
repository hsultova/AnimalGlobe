export async function login(email: string, password: string): Promise<void> {
  const response = await fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error(`Login failed: API error ${response.status}`)
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/user/logout', { method: 'POST', credentials: 'include' })
  if (!response.ok) throw new Error(`Logout failed: API error ${response.status}`)
}

export async function isLoggedIn(): Promise<boolean> {
  const response = await fetch('/api/user/me', {credentials: 'include'})
  return response.ok // 200 with a valid cookie, 401 without
}