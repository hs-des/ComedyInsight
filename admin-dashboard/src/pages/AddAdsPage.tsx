import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Save, X, AlertCircle, CheckCircle, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react'

export default function AddAdsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    ad_type: 'banner',
    position: 'home_top',
    ad_url: '',
    image_url: '',
    video_url: '',
    click_url: '',
    start_date: '',
    end_date: '',
    is_active: true,
    max_impressions: '',
    max_clicks: '',
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/admin/ads', data)
      return response.data
    },
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      setTimeout(() => {
        navigate('/ads')
      }, 1500)
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create ad')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!formData.title || !formData.ad_type || !formData.position) {
      setError('Title, Ad Type, and Position are required')
      return
    }

    const submitData = {
      ...formData,
      max_impressions: formData.max_impressions ? parseInt(formData.max_impressions, 10) : null,
      max_clicks: formData.max_clicks ? parseInt(formData.max_clicks, 10) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    }

    createMutation.mutate(submitData)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Add New Ad</h1>
        <button
          onClick={() => navigate('/ads')}
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
          <p className="text-green-300">Ad created successfully! Redirecting...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Ad Campaign Title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ad Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.ad_type}
              onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              required
            >
              <option value="banner">Banner</option>
              <option value="interstitial">Interstitial</option>
              <option value="rewarded">Rewarded</option>
              <option value="native">Native</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Position <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              required
            >
              <option value="home_top">Home Top</option>
              <option value="home_bottom">Home Bottom</option>
              <option value="video_before">Before Video</option>
              <option value="video_after">After Video</option>
              <option value="video_mid">Mid Video</option>
              <option value="category_top">Category Top</option>
              <option value="search_top">Search Top</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">AdMob Ad Unit ID / Ad URL</label>
            <input
              type="text"
              value={formData.ad_url}
              onChange={(e) => setFormData({ ...formData, ad_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="ca-app-pub-xxxxx/xxxxx or custom URL"
            />
          </div>
        </div>

        {/* Media URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <ImageIcon size={16} className="inline mr-2" />
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Video size={16} className="inline mr-2" />
              Video URL
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://example.com/video.mp4"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <LinkIcon size={16} className="inline mr-2" />
              Click URL
            </label>
            <input
              type="url"
              value={formData.click_url}
              onChange={(e) => setFormData({ ...formData, click_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://example.com/landing-page"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Impressions (0 = unlimited)</label>
            <input
              type="number"
              value={formData.max_impressions}
              onChange={(e) => setFormData({ ...formData, max_impressions: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Clicks (0 = unlimited)</label>
            <input
              type="number"
              value={formData.max_clicks}
              onChange={(e) => setFormData({ ...formData, max_clicks: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Active (Ad will be shown)</span>
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
            {createMutation.isPending ? 'Creating...' : 'Create Ad'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/ads')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

