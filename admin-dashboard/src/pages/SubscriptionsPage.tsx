import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { Edit, Trash2, Plus, CreditCard, Calendar, DollarSign } from 'lucide-react'

interface Subscription {
  id: string
  user_id: string
  username: string
  email: string
  type: string
  status: string
  start_date: string
  end_date: string
  amount: number
  currency: string
  created_at: string
}

export default function SubscriptionsPage() {
  const queryClient = useQueryClient()
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showPlanModal, setShowPlanModal] = useState(false)

  const { data: subscriptions = [], isLoading, error } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/subscriptions')
      console.log('Subscriptions API Response:', response.data)
      return response.data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/admin/subscriptions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-300'
      case 'cancelled':
        return 'bg-red-900 text-red-300'
      case 'expired':
        return 'bg-gray-900 text-gray-300'
      default:
        return 'bg-yellow-900 text-yellow-300'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Subscription Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Manage Plans
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading subscriptions...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading subscriptions: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Period</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{subscription.username || 'N/A'}</div>
                        <div className="text-gray-400 text-sm">{subscription.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 capitalize">{subscription.type || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        {subscription.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {subscription.currency} {subscription.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="text-sm">
                        <div>Start: {new Date(subscription.start_date).toLocaleDateString()}</div>
                        <div>End: {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSubscription(subscription)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Edit className="text-blue-400" size={18} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(subscription.id)}
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

      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Manage Subscription Plans</h2>
            <p className="text-gray-400 mb-4">Feature coming soon: Create and manage subscription plans, discounts, and coupons.</p>
            <button
              onClick={() => setShowPlanModal(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
