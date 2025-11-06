import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { Edit, Trash2, Plus, Eye, MousePointer, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Ad {
  id: string
  title: string
  ad_type: string
  position: string
  ad_url: string
  image_url: string
  video_url: string
  click_url: string
  start_date: string
  end_date: string
  is_active: boolean
  max_impressions: number
  current_impressions: number
  max_clicks: number
  current_clicks: number
  created_at: string
}

export default function AdsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: ads = [], isLoading, error } = useQuery<Ad[]>({
    queryKey: ['ads'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/ads')
      console.log('Ads API Response:', response.data)
      return response.data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/admin/ads/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ads'] }),
  })

  const getAdTypeColor = (type: string) => {
    switch (type) {
      case 'banner':
        return 'bg-blue-900 text-blue-300'
      case 'interstitial':
        return 'bg-purple-900 text-purple-300'
      case 'rewarded':
        return 'bg-yellow-900 text-yellow-300'
      default:
        return 'bg-gray-900 text-gray-300'
    }
  }

  const getCTR = (ad: Ad) => {
    if (ad.current_impressions === 0) return 0
    return ((ad.current_clicks / ad.current_impressions) * 100).toFixed(2)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Advertisement Management</h1>
        <button
          onClick={() => navigate('/ads/add')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Ad
        </button>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading ads...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading ads: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Position</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Impressions</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Clicks</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">CTR</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No ads found. Create your first ad to get started.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{ad.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAdTypeColor(ad.ad_type)}`}>
                        {ad.ad_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 capitalize">{ad.position.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        {ad.current_impressions.toLocaleString()}
                        {ad.max_impressions > 0 && ` / ${ad.max_impressions.toLocaleString()}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="flex items-center gap-1">
                        <MousePointer size={14} />
                        {ad.current_clicks.toLocaleString()}
                        {ad.max_clicks > 0 && ` / ${ad.max_clicks.toLocaleString()}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{getCTR(ad)}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ad.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-900 text-gray-300'
                      }`}>
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/ads/edit/${ad.id}`)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Edit className="text-blue-400" size={18} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(ad.id)}
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
