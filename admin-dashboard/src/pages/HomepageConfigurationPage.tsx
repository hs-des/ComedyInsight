import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Save, Plus, Trash2, Edit, MoveUp, MoveDown, Image as ImageIcon, Video, Layout, AlertCircle, CheckCircle } from 'lucide-react'

interface HomepageSection {
  id: string
  name: string
  title: string
  layout_type: 'slider' | 'grid' | 'list'
  display_order: number
  item_type: 'video' | 'category' | 'artist' | 'ad'
  is_active: boolean
  items?: any[]
}

interface Video {
  id: string
  title: string
  thumbnail_url?: string
}

interface Category {
  id: string
  name: string
}

interface Artist {
  id: string
  name: string
}

interface Ad {
  id: string
  title: string
  ad_type: string
  position: string
}

export default function HomepageConfigurationPage() {
  const queryClient = useQueryClient()
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null)
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [showEditSectionModal, setShowEditSectionModal] = useState(false)

  // Fetch homepage sections (mock for now - will need backend endpoint)
  const { data: sections = [], isLoading } = useQuery<HomepageSection[]>({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // const response = await axios.get('/api/admin/homepage/sections')
      // return response.data || []
      return []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  // Fetch videos, categories, artists, and ads for section items
  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      const response = await axios.get('/api/videos')
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

  const { data: artists = [] } = useQuery<Artist[]>({
    queryKey: ['artists'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/artists')
      return response.data || []
    },
  })

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ['ads'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/ads')
      return response.data || []
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // TODO: Replace with actual API endpoint
      // const response = await axios.post('/api/admin/homepage/sections', data)
      // return response.data
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] })
      setShowAddSectionModal(false)
      setShowEditSectionModal(false)
    },
  })

  const [newSection, setNewSection] = useState({
    name: '',
    title: '',
    layout_type: 'slider' as 'slider' | 'grid' | 'list',
    item_type: 'video' as 'video' | 'category' | 'artist' | 'ad',
    display_order: sections.length + 1,
    is_active: true,
  })

  const handleAddSection = () => {
    saveMutation.mutate(newSection)
  }

  const handleEditSection = (section: HomepageSection) => {
    setSelectedSection(section)
    setShowEditSectionModal(true)
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'slider':
        return <Layout size={20} />
      case 'grid':
        return <Layout size={20} />
      case 'list':
        return <Layout size={20} />
      default:
        return <Layout size={20} />
    }
  }

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={16} />
      case 'category':
        return <Layout size={16} />
      case 'artist':
        return <ImageIcon size={16} />
      case 'ad':
        return <ImageIcon size={16} />
      default:
        return <Layout size={16} />
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Homepage Configuration</h1>
          <p className="text-gray-400 mt-2">Manage homepage sections, sliders, content, and ad placements</p>
        </div>
        <button
          onClick={() => setShowAddSectionModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Section
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-900/50 rounded-lg border border-blue-700 p-4 mb-6">
        <p className="text-blue-300 text-sm">
          <strong>Tip:</strong> Drag sections to reorder them. Sections appear on the homepage in the order shown below.
        </p>
      </div>

      {/* Sections List */}
      {isLoading ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading sections...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <Layout size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 mb-2">No homepage sections configured</p>
          <p className="text-gray-500 text-sm mb-4">Create your first section to start customizing the homepage</p>
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add First Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      className="p-1 hover:bg-gray-700 rounded"
                      disabled={index === 0}
                      title="Move up"
                    >
                      <MoveUp size={16} className={index === 0 ? 'text-gray-600' : 'text-gray-400'} />
                    </button>
                    <span className="text-xs text-gray-500 font-medium">{section.display_order}</span>
                    <button
                      className="p-1 hover:bg-gray-700 rounded"
                      disabled={index === sections.length - 1}
                      title="Move down"
                    >
                      <MoveDown size={16} className={index === sections.length - 1 ? 'text-gray-600' : 'text-gray-400'} />
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getSectionIcon(section.layout_type)}
                      <h3 className="text-xl font-bold text-white">{section.title}</h3>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        {section.name}
                      </span>
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs flex items-center gap-1">
                        {getItemTypeIcon(section.item_type)}
                        {section.item_type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        section.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-900 text-gray-300'
                      }`}>
                        {section.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      Layout: <span className="text-white capitalize">{section.layout_type}</span>
                      {' • '}
                      Items: <span className="text-white">{section.items?.length || 0}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditSection(section)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit section"
                  >
                    <Edit className="text-blue-400" size={18} />
                  </button>
                  <button
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Delete section"
                  >
                    <Trash2 className="text-red-400" size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Add Homepage Section</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Section Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newSection.name}
                  onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="featured-videos"
                />
                <p className="text-gray-400 text-xs mt-1">Internal identifier (lowercase, no spaces)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Section Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Featured Videos"
                />
                <p className="text-gray-400 text-xs mt-1">Display title shown to users</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Layout Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newSection.layout_type}
                    onChange={(e) => setNewSection({ ...newSection, layout_type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="slider">Slider (Horizontal Scroll)</option>
                    <option value="grid">Grid (2-3 Columns)</option>
                    <option value="list">List (Vertical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newSection.item_type}
                    onChange={(e) => setNewSection({ ...newSection, item_type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="video">Videos</option>
                    <option value="category">Categories</option>
                    <option value="artist">Artists</option>
                    <option value="ad">Advertisements</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSection.is_active}
                    onChange={(e) => setNewSection({ ...newSection, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
                  />
                  <span className="text-gray-300">Active (Visible on homepage)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleAddSection}
                disabled={!newSection.name || !newSection.title || saveMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                {saveMutation.isPending ? 'Creating...' : 'Create Section'}
              </button>
              <button
                onClick={() => {
                  setShowAddSectionModal(false)
                  setNewSection({
                    name: '',
                    title: '',
                    layout_type: 'slider',
                    item_type: 'video',
                    display_order: sections.length + 1,
                    is_active: true,
                  })
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {showEditSectionModal && selectedSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Homepage Section</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Section Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  defaultValue={selectedSection.title}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Layout Type
                  </label>
                  <select
                    defaultValue={selectedSection.layout_type}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="slider">Slider</option>
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content Type
                  </label>
                  <select
                    defaultValue={selectedSection.item_type}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="video">Videos</option>
                    <option value="category">Categories</option>
                    <option value="artist">Artists</option>
                    <option value="ad">Advertisements</option>
                  </select>
                </div>
              </div>

              {/* Section Items Management */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Section Items
                </label>
                <div className="border border-gray-600 rounded-lg p-4 bg-gray-700/50 min-h-[200px]">
                  <p className="text-gray-400 text-sm text-center py-8">
                    Item management will be available here
                  </p>
                  {/* TODO: Add item selection/management UI */}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={selectedSection.is_active}
                    className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
                  />
                  <span className="text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditSectionModal(false)
                  setSelectedSection(null)
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {saveMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-900/50 rounded-lg border border-green-700 p-4 flex items-center text-green-300">
          <CheckCircle size={20} className="mr-2" />
          <p>Section saved successfully!</p>
        </div>
      )}

      {saveMutation.isError && (
        <div className="fixed bottom-4 right-4 bg-red-900/50 rounded-lg border border-red-700 p-4 flex items-center text-red-300">
          <AlertCircle size={20} className="mr-2" />
          <p>Error saving section: {(saveMutation.error as any)?.message || 'Unknown error'}</p>
        </div>
      )}
    </div>
  )
}

