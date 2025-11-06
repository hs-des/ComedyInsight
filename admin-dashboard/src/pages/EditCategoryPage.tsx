import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Save, AlertCircle, CheckCircle } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  parent_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>()
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

  // Fetch category data
  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ['category', id],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/categories/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  // Fetch categories for parent selection (exclude current category)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/categories')
      return response.data || []
    },
  })

  // Populate form when category data loads
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        parent_id: category.parent_id || '',
        display_order: category.display_order || 0,
        is_active: category.is_active !== false,
      })
    }
  }, [category])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/admin/categories/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', id] })
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
    }

    updateMutation.mutate(data)
  }

  if (categoryLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <p className="text-gray-400">Loading category...</p>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <p className="text-red-400">Category not found</p>
      </div>
    )
  }

  // Filter out current category from parent options
  const parentOptions = categories.filter(cat => cat.id !== id)

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <h1 className="text-3xl font-bold text-white mb-6">Edit Category</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error/Success Messages */}
        {updateMutation.isError && (
          <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 flex items-center text-red-300">
            <AlertCircle size={20} className="mr-2" />
            <p>Error updating category: {(updateMutation.error as any)?.response?.data?.message || 'Unknown error'}</p>
          </div>
        )}

        {updateMutation.isSuccess && (
          <div className="bg-green-900/50 rounded-lg border border-green-700 p-4 flex items-center text-green-300">
            <CheckCircle size={20} className="mr-2" />
            <p>Category updated successfully!</p>
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
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <Save size={20} />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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

