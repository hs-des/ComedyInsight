import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2, Plus } from 'lucide-react'

interface Artist {
  id: string
  name: string
  slug: string
  bio: string
  profile_image_url: string
  is_active: boolean
  is_featured: boolean
  created_at: string
}

export default function ArtistsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: artists = [], isLoading, error } = useQuery<Artist[]>({
    queryKey: ['artists'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/artists')
      console.log('Artists API Response:', response.data)
      return response.data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/admin/artists/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['artists'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Artists</h1>
        <button
          onClick={() => navigate('/artists/add')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Artist
        </button>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading artists...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading artists: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Slug</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Bio</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {artists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No artists found. Add your first artist to get started.
                  </td>
                </tr>
              ) : (
                artists.map((artist) => (
                  <tr key={artist.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{artist.name}</td>
                    <td className="px-6 py-4 text-gray-300">{artist.slug}</td>
                    <td className="px-6 py-4 text-gray-300">{artist.bio ? (artist.bio.length > 50 ? artist.bio.substring(0, 50) + '...' : artist.bio) : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        artist.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-900 text-gray-300'
                      }`}>
                        {artist.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/artists/edit/${artist.id}`)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Edit className="text-blue-400" size={18} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(artist.id)}
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
