import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Route-level code splitting: each page ships as its own chunk. This keeps the
// heavy globe/three.js bundle (GlobePage) out of the admin routes, and vice versa.
const GlobePage = lazy(() => import('./pages/GlobePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AnimalPage = lazy(() => import('./pages/AnimalPage'))
const AnimalFormPage = lazy(() => import('./pages/AnimalFormPage'))
const ImportPage = lazy(() => import('./pages/ImportPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p style={{ padding: 20, fontFamily: 'system-ui' }}>Loading…</p>}>
        <Routes>
          <Route path="/" element={<GlobePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/animals" element={<ProtectedRoute><AnimalPage /></ProtectedRoute>} />
          <Route path="/animals/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
          <Route path="/animals/:id" element={<ProtectedRoute><AnimalFormPage /></ProtectedRoute>} />
          <Route path="/animals/new" element={<ProtectedRoute><AnimalFormPage /></ProtectedRoute>} />
          <Route path="/animals/:id/edit" element={<ProtectedRoute><AnimalFormPage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}