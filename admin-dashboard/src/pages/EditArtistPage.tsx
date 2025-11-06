import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Save, X, AlertCircle, CheckCircle, Image as ImageIcon, Upload } from 'lucide-react'

interface Artist {
  id: string
  name: string
  slug: string
  bio: string
  profile_image_url: string
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at?: string
}

export default function EditArtistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bio: '',
    profile_image_url: '',
    is_active: true,
    is_featured: false,
  })

  // Fetch artist data
  const { data: artist, isLoading: artistLoading } = useQuery<Artist>({
    queryKey: ['artist', id],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/artists/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  // Populate form when artist data loads
  useEffect(() => {
    if (artist) {
      setFormData({
        name: artist.name || '',
        slug: artist.slug || '',
        bio: artist.bio || '',
        profile_image_url: artist.profile_image_url || '',
        is_active: artist.is_active !== false,
        is_featured: artist.is_featured || false,
      })
      if (artist.profile_image_url) {
        setImagePreview(artist.profile_image_url)
      }
    }
  }, [artist])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/admin/artists/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] })
      queryClient.invalidateQueries({ queryKey: ['artist', id] })
      navigate('/artists')
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setSelectedImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    const data = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }

    // TODO: Upload image file if selected
    if (selectedImageFile) {
      alert('Image upload not yet implemented. Please use image URL for now.')
      return
    }

    updateMutation.mutate(data)
  }

  if (artistLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <p className="text-gray-400">Loading artist...</p>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <p className="text-red-400">Artist not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <h1 className="text-3xl font-bold text-white mb-6">Edit Artist</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <ImageIcon size={16} className="inline mr-2" />
            Profile Image
          </label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center relative">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 mx-auto mb-2 rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageFile(null)
                    setImagePreview(null)
                    setFormData({ ...formData, profile_image_url: '' })
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageChange}
                  accept="image/*"
                />
                <div className="text-gray-400 text-sm">
                  <Upload size={24} className="mx-auto mb-2" />
                  Click to upload image (optional)
                </div>
              </>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-2">Or enter image URL:</p>
          <input
            type="url"
            value={formData.profile_image_url}
            onChange={(e) => {
              setFormData({ ...formData, profile_image_url: e.target.value })
              setImagePreview(e.target.value || null)
            }}
            className="w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Error/Success Messages */}
        {updateMutation.isError && (
          <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 flex items-center text-red-300">
            <AlertCircle size={20} className="mr-2" />
            <p>Error updating artist: {(updateMutation.error as any)?.response?.data?.message || 'Unknown error'}</p>
          </div>
        )}

        {updateMutation.isSuccess && (
          <div className="bg-green-900/50 rounded-lg border border-green-700 p-4 flex items-center text-green-300">
            <CheckCircle size={20} className="mr-2" />
            <p>Artist updated successfully!</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Enter artist biography..."
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Active</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Featured Artist</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <Save size={20} />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/artists')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

