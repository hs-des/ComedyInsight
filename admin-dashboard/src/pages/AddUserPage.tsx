import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Save, X, AlertCircle, CheckCircle, User, Mail, Phone } from 'lucide-react'

export default function AddUserPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_email_verified: false,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/admin/users', data)
      return response.data
    },
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setTimeout(() => {
        navigate('/users')
      }, 1500)
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create user')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!formData.username && !formData.email && !formData.phone) {
      setError('At least one of username, email, or phone is required')
      return
    }

    createMutation.mutate(formData)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Add New User</h1>
        <button
          onClick={() => navigate('/users')}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-400" size={20} />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="text-green-400" size={20} />
          <p className="text-green-300">User created successfully! Redirecting...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User size={16} className="inline mr-2" />
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Phone size={16} className="inline mr-2" />
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="+1234567890"
            />
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="John"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Active (User can login)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_email_verified}
              onChange={(e) => setFormData({ ...formData, is_email_verified: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Email Verified</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <Save size={20} />
            {createMutation.isPending ? 'Creating...' : 'Create User'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/users')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

