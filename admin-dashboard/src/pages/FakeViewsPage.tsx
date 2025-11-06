import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { Play, Trash2, Plus, Eye, Calendar, TrendingUp } from 'lucide-react'

interface FakeViewCampaign {
  id: string
  video_id: string
  video_title: string
  request_type: string
  fake_views_count: number
  notes: string
  created_at: string
  created_by: string
}

export default function FakeViewsPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    video_id: '',
    total_count: 0,
    duration_days: 7,
    pattern: 'steady' as 'burst' | 'steady',
    daily_limit: 0,
  })

  const { data: campaigns = [], isLoading, error } = useQuery<FakeViewCampaign[]>({
    queryKey: ['fake-views'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/fake-views')
      console.log('Fake views API Response:', response.data)
      return response.data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/admin/fake-views/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fake-views'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Fake Views Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Create Campaign
        </button>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading campaigns...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading campaigns: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Video</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Views</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Created By</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No campaigns found. Create your first campaign to get started.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{campaign.video_title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.request_type === 'boost' ? 'bg-green-900 text-green-300' :
                        campaign.request_type === 'remove' ? 'bg-red-900 text-red-300' :
                        'bg-yellow-900 text-yellow-300'
                      }`}>
                        {campaign.request_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{campaign.fake_views_count.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-300">{campaign.created_by}</td>
                    <td className="px-6 py-4 text-gray-300">{new Date(campaign.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => deleteMutation.mutate(campaign.id)}
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

