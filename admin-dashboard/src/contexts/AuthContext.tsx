import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Configure axios to include auth token in requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      setUser({ role: 'admin' })
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/admin/login', { username, password })
      const { token, user } = response.data
      
      localStorage.setItem('admin_token', token)
      setUser(user)
      setIsAuthenticated(true)
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

