import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from './Layout'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Layout />
}

