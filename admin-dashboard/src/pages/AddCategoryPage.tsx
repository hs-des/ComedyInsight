import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Save, AlertCircle, CheckCircle } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

export default function AddCategoryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    display_order: 0,
    is_active: true,
  })

  // Fetch categories for parent selection
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/categories')
      return response.data || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/admin/categories', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      navigate('/categories')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    const data = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      parent_id: formData.parent_id || null,
      display_order: formData.display_order || undefined, // Let backend auto-assign if 0
    }

    createMutation.mutate(data)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <h1 className="text-3xl font-bold text-white mb-6">Add New Category</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error/Success Messages */}
        {createMutation.isError && (
          <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 flex items-center text-red-300">
            <AlertCircle size={20} className="mr-2" />
            <p>Error creating category: {(createMutation.error as any)?.response?.data?.message || 'Unknown error'}</p>
          </div>
        )}

        {createMutation.isSuccess && (
          <div className="bg-green-900/50 rounded-lg border border-green-700 p-4 flex items-center text-green-300">
            <CheckCircle size={20} className="mr-2" />
            <p>Category created successfully!</p>
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
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                // Auto-generate slug if not manually set
                if (!formData.slug) {
                  const autoSlug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  setFormData(prev => ({ ...prev, slug: autoSlug }))
                }
              }}
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
              placeholder="auto-generated-from-name"
            />
            <p className="text-gray-400 text-xs mt-1">Leave empty to auto-generate from name</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Enter category description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Parent Category
            </label>
            <select
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">None (Top-level category)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              min="0"
            />
            <p className="text-gray-400 text-xs mt-1">Leave 0 to auto-assign</p>
          </div>
        </div>

        {/* Checkbox */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
            />
            <span className="text-gray-300">Active</span>
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
            {createMutation.isPending ? 'Creating...' : 'Create Category'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

