import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { Edit, Trash2, Mail, Phone, User, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  username: string
  email: string
  phone: string
  first_name: string
  last_name: string
  is_active: boolean
  is_email_verified: boolean
  created_at: string
}

export default function UsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/users')
      console.log('Users API Response:', response.data)
      return response.data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <button
          onClick={() => navigate('/users/add')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading users...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading users: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Verified</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="text-primary" size={20} />
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.username || 'N/A'}
                          </div>
                          <div className="text-gray-400 text-sm">@{user.username || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.email || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-900 text-gray-300'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_email_verified ? 'bg-blue-900 text-blue-300' : 'bg-gray-900 text-gray-300'
                      }`}>
                        {user.is_email_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/users/edit/${user.id}`)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Edit className="text-blue-400" size={18} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(user.id)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="text-red-400" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
