import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Save, X, AlertCircle, CheckCircle, Plus, Star, Image as ImageIcon, Video, FileText, Languages, Trash2 } from 'lucide-react'

interface Artist {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface VideoData {
  id: string
  title: string
  description: string
  thumbnail_url: string
  video_url: string
  rating?: number
  trailer_url?: string
  video_type: string
  language: string
  is_premium: boolean
  is_featured: boolean
  is_active: boolean
  tags: string[]
  published_at: string | null
  artists: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
  metadata?: Record<string, any>
}

export default function EditVideoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
  const [selectedSubtitleFiles, setSelectedSubtitleFiles] = useState<{ file: File; language: string }[]>([])
  const [existingSubtitles, setExistingSubtitles] = useState<Array<{ id: string; language: string; subtitle_url: string }>>([])
  const [showAddArtistModal, setShowAddArtistModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [newArtistName, setNewArtistName] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rating: '',
    trailer_url: '',
    selectedArtistIds: [] as string[],
    selectedCategoryIds: [] as string[],
    videoType: 'full',
    language: 'en',
    isPremium: false,
    isFeatured: false,
    isActive: true,
    tags: '',
    publishedAt: '',
  })

  // Fetch video data
  const { data: video, isLoading: videoLoading } = useQuery<VideoData>({
    queryKey: ['video', id],
    queryFn: async () => {
      const response = await axios.get(`/api/videos/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  // Fetch existing subtitles for the video
  const { data: subtitles = [] } = useQuery({
    queryKey: ['subtitles', id],
    queryFn: async () => {
      if (!id) return []
      try {
        const response = await axios.get(`/api/videos/${id}/subtitles`)
        return response.data || []
      } catch (error) {
        return []
      }
    },
    enabled: !!id,
  })

  // Populate form when video data loads
  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title || '',
        description: video.description || '',
        rating: video.rating?.toString() || video.metadata?.rating?.toString() || '',
        trailer_url: video.trailer_url || video.metadata?.trailer_url || '',
        selectedArtistIds: video.artists?.map(a => a.id) || [],
        selectedCategoryIds: video.categories?.map(c => c.id) || [],
        videoType: video.video_type || 'full',
        language: video.language || 'en',
        isPremium: video.is_premium || false,
        isFeatured: video.is_featured || false,
        isActive: video.is_active !== false,
        tags: video.tags?.join(', ') || '',
        publishedAt: video.published_at ? new Date(video.published_at).toISOString().slice(0, 16) : '',
      })
    }
  }, [video])

  useEffect(() => {
    if (subtitles && Array.isArray(subtitles)) {
      setExistingSubtitles(subtitles)
    }
  }, [subtitles])

  // Fetch artists and categories
  const { data: artists = [] } = useQuery<Artist[]>({
    queryKey: ['artists'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/artists')
      return response.data || []
    },
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/categories')
      return response.data || []
    },
  })

  const addArtistMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await axios.post('/api/admin/artists', { name, slug: name.toLowerCase().replace(/\s+/g, '-') })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] })
      setShowAddArtistModal(false)
      setNewArtistName('')
    },
  })

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await axios.post('/api/admin/categories', { name, slug: name.toLowerCase().replace(/\s+/g, '-') })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowAddCategoryModal(false)
      setNewCategoryName('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.put(`/api/videos/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      queryClient.invalidateQueries({ queryKey: ['video', id] })
      navigate('/videos')
    },
  })

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setSelectedThumbnailFile(file)
    }
  }

  const handleSubtitleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.srt') && !fileName.endsWith('.vtt')) {
        alert('Please select a subtitle file (.srt or .vtt)')
        return
      }
      const language = prompt('Enter language code (e.g., en, ar, es):') || 'en'
      if (language) {
        setSelectedSubtitleFiles(prev => [...prev, { file, language: language.toLowerCase() }])
      }
    }
  }

  const handleSubtitleFileRemove = (index: number) => {
    setSelectedSubtitleFiles(prev => prev.filter((_, i) => i !== index))
  }

  const deleteSubtitleMutation = useMutation({
    mutationFn: async (subtitleId: string) => {
      await axios.delete(`/api/admin/subtitles/${subtitleId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtitles', id] })
    },
  })

  const handleArtistToggle = (artistId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedArtistIds: prev.selectedArtistIds.includes(artistId)
        ? prev.selectedArtistIds.filter(id => id !== artistId)
        : [...prev.selectedArtistIds, artistId]
    }))
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategoryIds: prev.selectedCategoryIds.includes(categoryId)
        ? prev.selectedCategoryIds.filter(id => id !== categoryId)
        : [...prev.selectedCategoryIds, categoryId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = new FormData()
    if (selectedThumbnailFile) {
      data.append('thumbnail', selectedThumbnailFile)
    }
    // Append new subtitle files
    selectedSubtitleFiles.forEach((subtitle, index) => {
      data.append(`subtitles[${index}][file]`, subtitle.file)
      data.append(`subtitles[${index}][language]`, subtitle.language)
    })
    data.append('title', formData.title)
    data.append('description', formData.description)
    data.append('rating', formData.rating)
    data.append('trailer_url', formData.trailer_url)
    data.append('videoType', formData.videoType)
    data.append('language', formData.language)
    data.append('isPremium', String(formData.isPremium))
    data.append('isFeatured', String(formData.isFeatured))
    data.append('isActive', String(formData.isActive))
    data.append('tags', formData.tags)
    if (formData.publishedAt) {
      data.append('publishedAt', formData.publishedAt)
    }
    formData.selectedArtistIds.forEach(id => data.append('artistIds[]', id))
    formData.selectedCategoryIds.forEach(id => data.append('categoryIds[]', id))

    updateMutation.mutate(data)
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★')
      } else if (i === fullStars && hasHalfStar) {
        stars.push('☆')
      } else {
        stars.push('☆')
      }
    }
    return stars.join('')
  }

  if (videoLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <p className="text-gray-400">Loading video...</p>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <p className="text-red-400">Video not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <h1 className="text-3xl font-bold text-white mb-6">Edit Video</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thumbnail Upload/Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <ImageIcon size={16} className="inline mr-2" />
            Thumbnail Image
          </label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center relative">
            {video.thumbnail_url && !selectedThumbnailFile && (
              <img
                src={video.thumbnail_url}
                alt="Current thumbnail"
                className="max-h-48 mx-auto mb-2 rounded"
              />
            )}
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleThumbnailFileChange}
              accept="image/*"
            />
            {selectedThumbnailFile ? (
              <div className="flex items-center justify-center text-green-400">
                <ImageIcon size={20} className="mr-2" />
                <span>{selectedThumbnailFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedThumbnailFile(null)}
                  className="ml-4 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                {video.thumbnail_url ? 'Click to change thumbnail' : 'Click to upload thumbnail'}
              </div>
            )}
          </div>
        </div>

        {/* Update Status */}
        {updateMutation.isError && (
          <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 flex items-center text-red-300">
            <AlertCircle size={20} className="mr-2" />
            <p>Error updating video: {(updateMutation.error as any)?.message || 'Unknown error'}</p>
          </div>
        )}

        {updateMutation.isSuccess && (
          <div className="bg-green-900/50 rounded-lg border border-green-700 p-4 flex items-center text-green-300">
            <CheckCircle size={20} className="mr-2" />
            <p>Video updated successfully!</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FileText size={16} className="inline mr-2" />
              Description / Details
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Enter detailed description about the video..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Star size={16} className="inline mr-2" />
              Rating (0-5)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-24 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="4.5"
              />
              {formData.rating && (
                <span className="text-yellow-400 text-lg">
                  {renderStars(parseFloat(formData.rating))}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trailer URL
            </label>
            <input
              type="url"
              value={formData.trailer_url}
              onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://example.com/trailer.mp4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Video Type</label>
            <select
              value={formData.videoType}
              onChange={(e) => setFormData({ ...formData, videoType: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="full">Full</option>
              <option value="short">Short</option>
              <option value="preview">Preview</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        {/* Artists Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">Artists</label>
            <button
              type="button"
              onClick={() => setShowAddArtistModal(true)}
              className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
            >
              <Plus size={16} />
              Add New Artist
            </button>
          </div>
          <select
            multiple
            value={formData.selectedArtistIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value)
              setFormData(prev => ({ ...prev, selectedArtistIds: selected }))
            }}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary min-h-[120px]"
            size={5}
          >
            {artists.length === 0 ? (
              <option disabled>No artists available. Add one to get started.</option>
            ) : (
              artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))
            )}
          </select>
          <p className="text-gray-400 text-xs mt-1">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple artists
          </p>
          {formData.selectedArtistIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.selectedArtistIds.map((artistId) => {
                const artist = artists.find(a => a.id === artistId)
                return artist ? (
                  <span
                    key={artistId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-sm"
                  >
                    {artist.name}
                    <button
                      type="button"
                      onClick={() => handleArtistToggle(artistId)}
                      className="hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ) : null
              })}
            </div>
          )}
        </div>

        {/* Categories Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">Categories</label>
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
            >
              <Plus size={16} />
              Add New Category
            </button>
          </div>
          <select
            multiple
            value={formData.selectedCategoryIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value)
              setFormData(prev => ({ ...prev, selectedCategoryIds: selected }))
            }}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary min-h-[120px]"
            size={5}
          >
            {categories.length === 0 ? (
              <option disabled>No categories available. Add one to get started.</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
          <p className="text-gray-400 text-xs mt-1">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple categories
          </p>
          {formData.selectedCategoryIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.selectedCategoryIds.map((categoryId) => {
                const category = categories.find(c => c.id === categoryId)
                return category ? (
                  <span
                    key={categoryId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-sm"
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={() => handleCategoryToggle(categoryId)}
                      className="hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ) : null
              })}
            </div>
          )}
        </div>

        {/* Subtitles/Translations */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Languages size={16} className="inline mr-2" />
            Subtitles / Translations
          </label>
          <div className="border border-gray-600 rounded-lg p-4 bg-gray-700/50">
            {/* Existing Subtitles */}
            {existingSubtitles.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Existing Subtitles:</p>
                <div className="space-y-2">
                  {existingSubtitles.map((subtitle) => (
                    <div key={subtitle.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-white text-sm">{subtitle.language.toUpperCase()}</span>
                        <span className="text-gray-400 text-xs">{subtitle.subtitle_url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSubtitleMutation.mutate(subtitle.id)}
                        className="p-1 hover:bg-gray-700 rounded text-red-400"
                        disabled={deleteSubtitleMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Subtitles */}
            <div className="mb-3">
              <input
                type="file"
                id="subtitle-upload-edit"
                className="hidden"
                accept=".srt,.vtt"
                onChange={handleSubtitleFileAdd}
              />
              <label
                htmlFor="subtitle-upload-edit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition-colors"
              >
                <Plus size={16} />
                Add Subtitle File (.srt or .vtt)
              </label>
            </div>
            {selectedSubtitleFiles.length > 0 && (
              <div className="space-y-2">
                {selectedSubtitleFiles.map((subtitle, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-white text-sm">{subtitle.file.name}</span>
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                        {subtitle.language.toUpperCase()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSubtitleFileRemove(index)}
                      className="p-1 hover:bg-gray-700 rounded text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-gray-400 text-xs mt-2">
              Upload subtitle files in SRT or VTT format. You can add multiple languages.
            </p>
          </div>
        </div>

        {/* Additional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="comedy, stand-up, funny (comma separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Published Date</label>
            <input
              type="datetime-local"
              value={formData.publishedAt}
              onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPremium}
              onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Premium Content</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Featured Video</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Active (Published)</span>
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
            onClick={() => navigate('/videos')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Add Artist Modal */}
      {showAddArtistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Artist</h2>
            <input
              type="text"
              value={newArtistName}
              onChange={(e) => setNewArtistName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4"
              placeholder="Artist name"
            />
            <div className="flex gap-2">
              <button
                onClick={() => addArtistMutation.mutate(newArtistName)}
                disabled={!newArtistName || addArtistMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                {addArtistMutation.isPending ? 'Adding...' : 'Add Artist'}
              </button>
              <button
                onClick={() => setShowAddArtistModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Category</h2>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4"
              placeholder="Category name"
            />
            <div className="flex gap-2">
              <button
                onClick={() => addCategoryMutation.mutate(newCategoryName)}
                disabled={!newCategoryName || addCategoryMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                {addCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
              </button>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
