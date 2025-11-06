import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { Send, Bell, X, Users } from 'lucide-react'

interface Notification {
  id: string
  user_id: string
  username: string
  email: string
  title: string
  body: string
  notification_type: string
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [showSendModal, setShowSendModal] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    body: '',
    notification_type: 'general',
  })

  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/notifications')
      console.log('Notifications API Response:', response.data)
      return response.data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  const sendMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/admin/notifications', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setShowSendModal(false)
      setFormData({ user_id: '', title: '', body: '', notification_type: 'general' })
    },
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    sendMutation.mutate(formData)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Notification Management</h1>
        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Send size={20} />
          Send Notification
        </button>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading notifications: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Body</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No notifications found.
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{notification.username || 'All Users'}</div>
                        <div className="text-gray-400 text-sm">{notification.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{notification.title}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {notification.body.length > 50 ? `${notification.body.substring(0, 50)}...` : notification.body}
                    </td>
                    <td className="px-6 py-4 text-gray-300 capitalize">{notification.notification_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.is_read ? 'bg-gray-900 text-gray-300' : 'bg-blue-900 text-blue-300'
                      }`}>
                        {notification.is_read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{new Date(notification.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Send Notification</h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={20} />
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  User ID (leave empty to send to all users)
                </label>
                <input
                  type="text"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Leave empty for all users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Body <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.notification_type}
                  onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="general">General</option>
                  <option value="promotion">Promotion</option>
                  <option value="update">Update</option>
                  <option value="alert">Alert</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={sendMutation.isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  <Send size={20} />
                  {sendMutation.isPending ? 'Sending...' : 'Send Notification'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
