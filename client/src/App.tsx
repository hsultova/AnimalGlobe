import { BrowserRouter, Route, Routes } from 'react-router-dom'
import GlobePage from './pages/GlobePage'
import LoginPage from './pages/LoginPage'
import AnimalPage from './pages/AnimalPage'
import AnimalFormPage from './pages/AnimalFormPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GlobePage />} />
        <Route path="/login" element={<LoginPage />} />  
        <Route path="/animals" element={<ProtectedRoute><AnimalPage /></ProtectedRoute>} />
        <Route path="/animals/:id" element={<ProtectedRoute><AnimalFormPage /></ProtectedRoute>} />
        <Route path="/animals/new" element={<ProtectedRoute><AnimalFormPage /></ProtectedRoute>} />
        <Route path="/animals/:id/edit" element={<ProtectedRoute><AnimalFormPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}