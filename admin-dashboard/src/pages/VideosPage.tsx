import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { useNavigate } from 'react-router-dom'
import { Edit, Trash2, Upload, Plus } from 'lucide-react'

interface Video {
  id: string
  title: string
  artist: string
  views: number
  duration: number
  status: string
  thumbnail: string
}

export default function VideosPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: videos = [], isLoading, error } = useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      const response = await axios.get('/api/videos')
      console.log('Videos API Response:', response.data)
      return response.data || []
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Always refetch when component mounts
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/videos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Videos</h1>
        <button
          onClick={() => navigate('/videos/upload')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Upload Video
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading videos...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading videos: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {/* Videos Table */}
      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Artist</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Views</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No videos found. Upload your first video to get started.
                  </td>
                </tr>
              ) : (
                videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{video.title}</td>
                <td className="px-6 py-4 text-gray-300">{video.artist}</td>
                <td className="px-6 py-4 text-gray-300">{video.views.toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-300">{Math.floor(video.duration / 60)} min</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    video.status === 'published' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                  }`}>
                    {video.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/videos/edit/${video.id}`)}
                      className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Edit className="text-blue-400" size={18} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(video.id)}
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

