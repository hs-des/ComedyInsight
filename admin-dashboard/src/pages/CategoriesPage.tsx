import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2, Plus } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  parent_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export default function CategoriesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/categories')
      console.log('Categories API Response:', response.data)
      return response.data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`/api/admin/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Categories</h1>
        <button
          onClick={() => navigate('/categories/add')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading categories...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading categories: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Slug</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Description</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Order</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No categories found. Add your first category to get started.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{category.name}</td>
                    <td className="px-6 py-4 text-gray-300">{category.slug}</td>
                    <td className="px-6 py-4 text-gray-300">{category.description ? (category.description.length > 50 ? category.description.substring(0, 50) + '...' : category.description) : '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{category.display_order}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-900 text-gray-300'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/categories/edit/${category.id}`)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Edit className="text-blue-400" size={18} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(category.id)}
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
