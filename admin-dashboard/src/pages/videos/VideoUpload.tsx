import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Divider,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Space,
  Switch,
  Upload,
  Typography,
  Tag,
  List,
} from 'antd'
import type { UploadProps } from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SaveOutlined,
  UploadOutlined,
  VideoCameraAddOutlined,
} from '@ant-design/icons'

import type { Artist, Category, VideoFormValues } from '../../types/content'
import {
  createVideo,
  fetchArtists,
  fetchCategories,
  getVideo,
  updateVideo,
  uploadFileWithProgress,
} from '../../services/contentService'
import { useNotifications } from '../../contexts/NotificationContext'

const { TextArea } = Input
const { Text } = Typography

const defaultValues: VideoFormValues = {
  title: '',
  slug: '',
  description: '',
  thumbnail_url: undefined,
  video_url: undefined,
  duration_seconds: undefined,
  status: 'draft',
  release_date: undefined,
  is_featured: false,
  metadata: {
    rating: '',
    trailer_url: '',
    tags: [],
    language: 'en',
  },
  artist_ids: [],
  category_ids: [],
  subtitles: [],
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export default function VideoUpload() {
  const navigate = useNavigate()
  const params = useParams()
  const videoId = params.videoId as string | undefined
  const isEditMode = Boolean(videoId)
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<VideoFormValues>({ defaultValues })

  const {
    fields: subtitleFields,
    append: appendSubtitle,
    remove: removeSubtitle,
    update: updateSubtitleField,
  } = useFieldArray({ control, name: 'subtitles' })

  const [videoUploadPercent, setVideoUploadPercent] = useState(0)
  const [thumbnailUploadPercent, setThumbnailUploadPercent] = useState(0)
  const [subtitleUploadPercent, setSubtitleUploadPercent] = useState(0)

  const videoQuery = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => getVideo(videoId!),
    enabled: isEditMode,
    onSuccess: (data) => {
      const {
        title,
        slug,
        description,
        thumbnail_url,
        video_url,
        duration_seconds,
        status,
        release_date,
        is_featured,
        metadata,
        artists,
        categories,
        subtitles,
      } = data
      reset({
        title,
        slug,
        description: description ?? '',
        thumbnail_url: thumbnail_url ?? undefined,
        video_url: video_url ?? undefined,
        duration_seconds: duration_seconds ?? undefined,
        status,
        release_date: release_date ?? undefined,
        is_featured,
        metadata: {
          rating: (metadata?.rating as string) ?? '',
          trailer_url: (metadata?.trailer_url as string) ?? '',
          tags: (metadata?.tags as string[]) ?? [],
          language: (metadata?.language as string) ?? 'en',
        },
        artist_ids: artists.map((artist) => artist.id),
        category_ids: categories.map((category) => category.id),
        subtitles: subtitles.map((subtitle) => ({
          language: subtitle.language,
          label: subtitle.label ?? '',
          file_url: subtitle.file_url,
        })),
      })
    },
  })

  const artistsQuery = useQuery({
    queryKey: ['video-form-artists'],
    queryFn: () => fetchArtists({ page: 1, pageSize: 200 }),
  })

  const categoriesQuery = useQuery({
    queryKey: ['video-form-categories'],
    queryFn: () => fetchCategories({ page: 1, pageSize: 200 }),
  })

  const mutation = useMutation({
    mutationFn: (payload: VideoFormValues) => {
      if (isEditMode && videoId) {
        return updateVideo(videoId, payload)
      }
      return createVideo(payload)
    },
    onSuccess: (video) => {
      notify({ title: 'Video saved', description: `${video.title} updated successfully.`, variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      navigate('/videos')
    },
    onError: () => notify({ title: 'Save failed', description: 'Unable to save video.', variant: 'error' }),
  })

  const handleGenerateSlug = () => {
    const name = watch('title') || ''
    if (!name) return
    setValue('slug', slugify(name), { shouldDirty: true })
  }

  const buildUploadProps = (type: 'video' | 'thumbnail' | 'subtitle'): UploadProps => ({
    multiple: false,
    showUploadList: false,
    accept: type === 'video' ? 'video/*' : type === 'thumbnail' ? 'image/*' : '.srt,.vtt',
    customRequest: async ({ file, onError, onSuccess, onProgress }) => {
      const actualFile = file as File
      try {
        const setPercent = type === 'video' ? setVideoUploadPercent : type === 'thumbnail' ? setThumbnailUploadPercent : setSubtitleUploadPercent
        const response = await uploadFileWithProgress(actualFile, (percent) => {
          setPercent(percent)
          onProgress?.({ percent })
        })
        setPercent(0)

        if (type === 'video') {
          setValue('video_url', response.object_url, { shouldDirty: true })
        } else if (type === 'thumbnail') {
          setValue('thumbnail_url', response.object_url, { shouldDirty: true })
        } else {
          appendSubtitle({
            file_url: response.object_url,
            language: 'en',
            label: actualFile.name.replace(/\.(srt|vtt)$/i, ''),
          })
        }
        onSuccess?.(undefined, file as any)
        notify({ title: 'Upload complete', description: `${actualFile.name} uploaded successfully.`, variant: 'success' })
      } catch (error) {
        if (type === 'video') setVideoUploadPercent(0)
        if (type === 'thumbnail') setThumbnailUploadPercent(0)
        if (type === 'subtitle') setSubtitleUploadPercent(0)
        onError?.(error as Error)
        notify({ title: 'Upload failed', description: 'Unable to upload file.', variant: 'error' })
      }
    },
  })

  const videoUploadProps = useMemo(() => buildUploadProps('video'), [])
  const thumbnailUploadProps = useMemo(() => buildUploadProps('thumbnail'), [])
  const subtitleUploadProps = useMemo(() => buildUploadProps('subtitle'), [])

  const onSubmit = (values: VideoFormValues) => {
    const payload: VideoFormValues = {
      ...values,
      slug: values.slug || slugify(values.title),
      subtitles: values.subtitles.map((subtitle) => ({
        ...subtitle,
        label: subtitle.label || subtitle.language.toUpperCase(),
      })),
    }
    mutation.mutate(payload)
  }

  const hasVideoAsset = Boolean(watch('video_url'))
  const hasThumbnail = Boolean(watch('thumbnail_url'))

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">{isEditMode ? 'Edit video' : 'Upload video'}</h1>
          <p className="text-gray-400">Upload source files, enrich metadata, and publish to ComedyInsight.</p>
        </div>
      </header>

      {videoQuery.isLoading && isEditMode ? (
        <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
            <div className="grid gap-6 lg:grid-cols-2">
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Title</label>
                    <Input {...field} size="large" placeholder="Showcase title" />
                    {errors.title && <Text type="danger">{errors.title.message}</Text>}
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
                    render={({ field }) => <Input {...field} size="large" placeholder="standup-special-2025" />}
                  />
                  <Button onClick={handleGenerateSlug} type="primary">
                    Generate
                  </Button>
                </Space.Compact>
                {errors.slug && <Text type="danger">{errors.slug.message}</Text>}
              </div>

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2 lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Description</label>
                    <TextArea {...field} rows={4} placeholder="Synopsis, highlights, and key selling points" />
                  </div>
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <Select
                      {...field}
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'published', label: 'Published' },
                        { value: 'archived', label: 'Archived' },
                      ]}
                    />
                  </div>
                )}
              />

              <Controller
                name="release_date"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Release date</label>
                    <Input type="date" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)} />
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

              <Controller
                name="duration_seconds"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Duration (seconds)</label>
                    <InputNumber
                      {...field}
                      min={0}
                      max={60 * 60 * 6}
                      style={{ width: '100%' }}
                      placeholder="Optional runtime"
                    />
                  </div>
                )}
              />
            </div>
          </Card>

          <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
            <h2 className="text-lg font-semibold text-white">Assets</h2>
            <p className="text-sm text-gray-400">Upload the master video file, poster artwork, and subtitle tracks.</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Video source</label>
                <Upload.Dragger {...videoUploadProps} className="bg-transparent text-gray-300">
                  <p className="ant-upload-drag-icon">
                    <VideoCameraAddOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag a video file to upload</p>
                  <p className="ant-upload-hint">Supported: MP4, MOV, MKV up to 4GB</p>
                  {videoUploadPercent > 0 && <Text className="mt-2 block text-primary">Uploading… {videoUploadPercent}%</Text>}
                </Upload.Dragger>
                {hasVideoAsset ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>Video uploaded</Tag>
                ) : (
                  <Tag color="default">No video uploaded</Tag>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Thumbnail</label>
                <Upload.Dragger {...thumbnailUploadProps} className="bg-transparent text-gray-300">
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag an image to upload</p>
                  <p className="ant-upload-hint">16:9 PNG/JPG recommended</p>
                  {thumbnailUploadPercent > 0 && <Text className="mt-2 block text-primary">Uploading… {thumbnailUploadPercent}%</Text>}
                </Upload.Dragger>
                {hasThumbnail && <img src={watch('thumbnail_url') ?? ''} alt="Thumbnail" className="h-40 w-full rounded-lg object-cover" />}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Subtitles</label>
                <Upload.Dragger {...subtitleUploadProps} className="bg-transparent text-gray-300">
                  <p className="ant-upload-drag-icon">
                    <FileTextOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag .srt/.vtt files</p>
                  {subtitleUploadPercent > 0 && <Text className="mt-2 block text-primary">Uploading… {subtitleUploadPercent}%</Text>}
                </Upload.Dragger>
                <List
                  bordered
                  className="bg-gray-900/40"
                  dataSource={subtitleFields}
                  locale={{ emptyText: 'No subtitles uploaded yet' }}
                  renderItem={(item, index) => (
                    <List.Item
                      actions={[
                        <Button key="delete" type="text" icon={<DeleteOutlined />} danger onClick={() => removeSubtitle(index)} />,
                      ]}
                    >
                      <Space direction="vertical" className="w-full">
                        <Input
                          placeholder="Label"
                          value={item.label}
                          onChange={(event) => updateSubtitleField(index, { ...item, label: event.target.value })}
                        />
                        <Select
                          value={item.language}
                          onChange={(value) => updateSubtitleField(index, { ...item, language: value })}
                          options={[
                            { value: 'en', label: 'English' },
                            { value: 'es', label: 'Spanish' },
                            { value: 'fr', label: 'French' },
                            { value: 'ar', label: 'Arabic' },
                            { value: 'de', label: 'German' },
                            { value: 'hi', label: 'Hindi' },
                            { value: 'custom', label: 'Custom code' },
                          ]}
                          dropdownMatchSelectWidth={false}
                        />
                        <Text type="secondary" className="text-xs break-words">
                          {item.file_url}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
            <h2 className="text-lg font-semibold text-white">Metadata</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Controller
                name="metadata.rating"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Content rating</label>
                    <Select
                      {...field}
                      allowClear
                      options={[
                        { value: 'G', label: 'G – General Audience' },
                        { value: 'PG', label: 'PG – Parental Guidance' },
                        { value: 'PG-13', label: 'PG-13 – Teens' },
                        { value: 'R', label: 'R – Restricted' },
                      ]}
                    />
                  </div>
                )}
              />

              <Controller
                name="metadata.language"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Primary language</label>
                    <Select
                      {...field}
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'fr', label: 'French' },
                        { value: 'ar', label: 'Arabic' },
                        { value: 'hi', label: 'Hindi' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                  </div>
                )}
              />

              <Controller
                name="metadata.trailer_url"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Trailer URL</label>
                    <Input {...field} placeholder="https://cdn.example.com/trailer.mp4" />
                  </div>
                )}
              />

              <Controller
                name="metadata.tags"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Tags</label>
                    <Select
                      {...field}
                      mode="tags"
                      tokenSeparators={[',']}
                      placeholder="Add keywords"
                      options={(field.value ?? []).map((tag: string) => ({ value: tag, label: tag }))}
                    />
                  </div>
                )}
              />
            </div>
          </Card>

          <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
            <h2 className="text-lg font-semibold text-white">Assignments</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Controller
                name="artist_ids"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Artists</label>
                    <Select
                      {...field}
                      mode="multiple"
                      loading={artistsQuery.isLoading}
                      placeholder="Select artists"
                      options={(artistsQuery.data?.items ?? []).map((artist: Artist) => ({ value: artist.id, label: artist.name }))}
                    />
                  </div>
                )}
              />

              <Controller
                name="category_ids"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Categories</label>
                    <Select
                      {...field}
                      mode="multiple"
                      loading={categoriesQuery.isLoading}
                      placeholder="Select categories"
                      options={(categoriesQuery.data?.items ?? []).map((category: Category) => ({ value: category.id, label: category.name }))}
                    />
                  </div>
                )}
              />
            </div>
          </Card>

          <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Review & save</h2>
                <p className="text-sm text-gray-400">Confirm assets and metadata before publishing.</p>
              </div>
              <Space>
                <Button onClick={() => navigate('/videos')}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={mutation.isPending} disabled={!isDirty && !isEditMode}>
                  {isEditMode ? 'Update video' : 'Create video'}
                </Button>
              </Space>
            </div>
          </Card>
        </form>
      )}

      <Divider />
      <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
        <h3 className="text-lg font-semibold text-white">Upload checklist</h3>
        <ul className="mt-2 space-y-2 text-sm text-gray-400">
          <li>Confirm video encoding (H.264/AAC) for best compatibility.</li>
          <li>Upload subtitles for accessibility and international reach.</li>
          <li>Use descriptive tags so editors can surface the content in curated rails.</li>
        </ul>
      </Card>
    </div>
  )
}
