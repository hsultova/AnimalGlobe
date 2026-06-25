import { useEffect, useState } from "react";
import { isLoggedIn } from "../api/auth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'in' | 'out'>('checking')

  useEffect(() => {
    isLoggedIn().then((ok) => setStatus(ok ? 'in' : 'out'))
  }, [])

  if (status === 'checking') return <p style={{ padding: 20 }}>Checking…</p>
  if (status === 'out') return <Navigate to="/login" replace />
  return <>{children}</>
}