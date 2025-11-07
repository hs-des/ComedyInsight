import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Input, Skeleton, Space, Switch, Upload, Typography, Divider } from 'antd'
import type { UploadProps } from 'antd'
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'

import type { ArtistFormValues } from '../../types/content'
import {
  createArtist,
  getArtist,
  updateArtist,
  uploadFileWithProgress,
} from '../../services/contentService'
import { useNotifications } from '../../contexts/NotificationContext'

const { TextArea } = Input
const { Text } = Typography

const defaultValues: ArtistFormValues = {
  name: '',
  slug: '',
  bio: '',
  profile_image_url: undefined,
  is_active: true,
  is_featured: false,
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export default function ArtistForm() {
  const navigate = useNavigate()
  const params = useParams()
  const artistId = params.artistId as string | undefined
  const isEditMode = Boolean(artistId)
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ArtistFormValues>({ defaultValues })

  const [uploadPercent, setUploadPercent] = useState<number>(0)
  const currentImage = watch('profile_image_url')

  const artistQuery = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => getArtist(artistId!),
    enabled: isEditMode,
    onSuccess: (data) => {
      const { name, slug, bio, profile_image_url, is_active, is_featured } = data
      reset({ name, slug, bio: bio ?? '', profile_image_url: profile_image_url ?? undefined, is_active, is_featured })
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: ArtistFormValues) => {
      if (isEditMode && artistId) {
        return updateArtist(artistId, payload)
      }
      return createArtist(payload)
    },
    onSuccess: (artist) => {
      notify({ title: 'Artist saved', description: `${artist.name} has been updated.`, variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['artists'] })
      navigate('/artists')
    },
    onError: () => notify({ title: 'Save failed', description: 'Unable to save artist right now.', variant: 'error' }),
  })

  const uploadProps = useMemo<UploadProps>(() => ({
    multiple: false,
    accept: 'image/*',
    showUploadList: false,
    customRequest: async ({ file, onError, onSuccess, onProgress }) => {
      try {
        const actualFile = file as File
        const response = await uploadFileWithProgress(actualFile, (percent) => {
          setUploadPercent(percent)
          onProgress?.({ percent })
        })
        setValue('profile_image_url', response.object_url, { shouldDirty: true })
        setUploadPercent(0)
        onSuccess?.(undefined, file as any)
        notify({ title: 'Upload complete', description: `${actualFile.name} uploaded successfully.`, variant: 'success' })
      } catch (error) {
        setUploadPercent(0)
        onError?.(error as Error)
        notify({ title: 'Upload failed', description: 'Could not upload image.', variant: 'error' })
      }
    },
  }), [notify, setValue])

  const onSubmit = (values: ArtistFormValues) => {
    const payload = {
      ...values,
      slug: values.slug || slugify(values.name),
    }
    mutation.mutate(payload)
  }

  const handleGenerateSlug = () => {
    const name = watch('name') || ''
    if (!name) return
    setValue('slug', slugify(name), { shouldDirty: true })
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">{isEditMode ? 'Edit artist' : 'Add artist'}</h1>
          <p className="text-gray-400">Manage performer profile details and availability.</p>
        </div>
      </header>

      {artistQuery.isLoading && isEditMode ? (
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
                    <label className="block text-sm font-medium text-gray-300">Artist name</label>
                    <Input {...field} size="large" placeholder="e.g. John Doe" />
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
                    render={({ field }) => <Input {...field} size="large" placeholder="unique-artist-slug" />}
                  />
                  <Button type="primary" onClick={handleGenerateSlug}>
                    Generate
                  </Button>
                </Space.Compact>
                {errors.slug && <Text type="danger">{errors.slug.message}</Text>}
              </div>

              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Bio</label>
                    <TextArea {...field} rows={5} placeholder="Short introduction, awards, and specialties" />
                  </div>
                )}
              />

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Profile image</label>
                <Upload.Dragger {...uploadProps} className="bg-transparent text-gray-300">
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag image to upload</p>
                  <p className="ant-upload-hint">PNG, JPG up to 5MB</p>
                  {uploadPercent > 0 && <Text className="mt-2 block text-primary">Uploading… {uploadPercent}%</Text>}
                </Upload.Dragger>
                {currentImage && (
                  <div className="overflow-hidden rounded-xl border border-gray-700">
                    <img src={currentImage} alt="Artist" className="h-48 w-full object-cover" />
                  </div>
                )}
              </div>

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

              <Controller
                name="is_featured"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Featured</label>
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
                <p className="text-sm text-gray-400">Ensure all details are accurate before publishing to the app.</p>
              </div>
              <Space>
                <Button onClick={() => navigate('/artists')}>Cancel</Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  loading={mutation.isPending}
                  disabled={!isDirty && !isEditMode}
                >
                  {isEditMode ? 'Update artist' : 'Create artist'}
                </Button>
              </Space>
            </div>
          </Card>
        </form>
      )}

      <Divider />
      <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
        <h3 className="text-lg font-semibold text-white">Tips</h3>
        <ul className="mt-2 space-y-2 text-sm text-gray-400">
          <li>Use high-resolution images with transparent backgrounds for best results.</li>
          <li>Featured artists are showcased on the homepage hero carousel.</li>
          <li>Keep biographies concise (200-400 characters) to avoid truncation on mobile.</li>
        </ul>
      </Card>
    </div>
  )
}
