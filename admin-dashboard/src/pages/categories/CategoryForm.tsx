import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Divider, Input, InputNumber, Select, Skeleton, Space, Switch, Typography } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'

import type { Category, CategoryFormValues } from '../../types/content'
import {
  createCategory,
  fetchCategories,
  getCategory,
  updateCategory,
} from '../../services/contentService'
import { useNotifications } from '../../contexts/NotificationContext'

const { Text } = Typography

const defaultValues: CategoryFormValues = {
  name: '',
  slug: '',
  description: '',
  parent_id: undefined,
  display_order: 0,
  is_active: true,
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export default function CategoryForm() {
  const navigate = useNavigate()
  const params = useParams()
  const categoryId = params.categoryId as string | undefined
  const isEditMode = Boolean(categoryId)
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CategoryFormValues>({ defaultValues })

  const nameValue = watch('name')

  const categoryQuery = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => getCategory(categoryId!),
    enabled: isEditMode,
    onSuccess: (data) => {
      const { name, slug, description, parent_id, display_order, is_active } = data
      reset({
        name,
        slug,
        description: description ?? '',
        parent_id: parent_id ?? undefined,
        display_order,
        is_active,
      })
    },
  })

  const parentOptionsQuery = useQuery({
    queryKey: ['category-options'],
    queryFn: () => fetchCategories({ page: 1, pageSize: 200 }),
  })

  const availableParents = useMemo(() => {
    const items = parentOptionsQuery.data?.items ?? []
    return items.filter((item) => item.id !== categoryId)
  }, [parentOptionsQuery.data?.items, categoryId])

  const mutation = useMutation({
    mutationFn: (payload: CategoryFormValues) => {
      if (isEditMode && categoryId) {
        return updateCategory(categoryId, payload)
      }
      return createCategory(payload)
    },
    onSuccess: (category) => {
      notify({ title: 'Category saved', description: `${category.name} updated successfully.`, variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      navigate('/categories')
    },
    onError: () => notify({ title: 'Save failed', description: 'Unable to save category.', variant: 'error' }),
  })

  const onSubmit = (values: CategoryFormValues) => {
    const payload = {
      ...values,
      slug: values.slug || slugify(values.name),
    }
    mutation.mutate(payload)
  }

  const handleSlug = () => {
    if (!nameValue) return
    setValue('slug', slugify(nameValue), { shouldDirty: true })
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">{isEditMode ? 'Edit category' : 'Add category'}</h1>
          <p className="text-gray-400">Define how videos are grouped throughout the app.</p>
        </div>
      </header>

      {categoryQuery.isLoading && isEditMode ? (
        <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
            <div className="grid gap-6 md:grid-cols-2">
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Category name</label>
                    <Input {...field} size="large" placeholder="e.g. Trending Specials" />
                    {errors.name && <Text type="danger">{errors.name.message}</Text>}
                  </div>
                )}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Slug</label>
                <Space.Compact style={{ width: '100%' }}>
                  <Controller
                    name="slug"
                    control={control}
                    rules={{ required: 'Slug is required' }}
                    render={({ field }) => <Input {...field} size="large" placeholder="trending-specials" />}
                  />
                  <Button onClick={handleSlug} type="primary">
                    Generate
                  </Button>
                </Space.Compact>
                {errors.slug && <Text type="danger">{errors.slug.message}</Text>}
              </div>

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Description</label>
                    <Input.TextArea {...field} rows={4} placeholder="Short summary for editors" />
                  </div>
                )}
              />

              <Controller
                name="parent_id"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Parent category</label>
                    <Select
                      {...field}
                      allowClear
                      placeholder="Top-level category"
                      loading={parentOptionsQuery.isLoading}
                      options={availableParents.map((category: Category) => ({
                        value: category.id,
                        label: category.name,
                      }))}
                    />
                  </div>
                )}
              />

              <Controller
                name="display_order"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Display order</label>
                    <InputNumber
                      {...field}
                      min={0}
                      max={999}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              />

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Active</label>
                    <Switch checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  </div>
                )}
              />
            </div>
          </Card>

          <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Review & save</h2>
                <p className="text-sm text-gray-400">Update the mobile and TV app navigation instantly.</p>
              </div>
              <Space>
                <Button onClick={() => navigate('/categories')}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={mutation.isPending}
                  disabled={!isDirty && !isEditMode}
                >
                  {isEditMode ? 'Update category' : 'Create category'}
                </Button>
              </Space>
            </div>
          </Card>
        </form>
      )}

      <Divider />
      <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
        <h3 className="text-lg font-semibold text-white">Best practices</h3>
        <ul className="mt-2 space-y-2 text-sm text-gray-400">
          <li>Use descriptive labels to help viewers browse quickly.</li>
          <li>Display order controls the arrangement on the homepage and navigation tabs.</li>
          <li>Inactive categories remain hidden but keep their associated videos.</li>
        </ul>
      </Card>
    </div>
  )
}
