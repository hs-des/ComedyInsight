import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Upload,
  Typography,
} from 'antd'
import type { UploadProps } from 'antd'
import { DeleteOutlined, EditOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons'

import type { Subtitle, Video } from '../../types/content'
import {
  createSubtitle,
  deleteSubtitle,
  fetchSubtitles,
  fetchVideos,
  updateSubtitle,
  uploadFileWithProgress,
} from '../../services/contentService'
import { useNotifications } from '../../contexts/NotificationContext'

const { Text } = Typography

interface EditState {
  id: string
  language: string
  label: string
}

export default function SubtitleManager() {
  const queryClient = useQueryClient()
  const { notify } = useNotifications()
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>(undefined)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [editState, setEditState] = useState<EditState | null>(null)

  const videosQuery = useQuery({
    queryKey: ['subtitle-videos'],
    queryFn: () => fetchVideos({ page: 1, pageSize: 200 }),
  })

  const subtitlesQuery = useQuery({
    queryKey: ['subtitles', selectedVideoId],
    queryFn: () => fetchSubtitles(selectedVideoId),
    enabled: Boolean(selectedVideoId),
  })

  const uploadProps = useMemo<UploadProps>(() => ({
    multiple: false,
    accept: '.srt,.vtt',
    showUploadList: false,
    customRequest: async ({ file, onError, onProgress, onSuccess }) => {
      if (!selectedVideoId) {
        notify({ title: 'Select a video', description: 'Choose a video before uploading subtitles.', variant: 'warning' })
        onError?.(new Error('Video not selected'))
        return
      }
      try {
        const actualFile = file as File
        const response = await uploadFileWithProgress(actualFile, (percent) => {
          setUploadPercent(percent)
          onProgress?.({ percent })
        })
        setUploadPercent(0)
        await createSubtitle({
          video_id: selectedVideoId,
          language: 'en',
          label: actualFile.name.replace(/\.(srt|vtt)$/i, ''),
          file_url: response.object_url,
        })
        notify({ title: 'Subtitle added', description: `${actualFile.name} uploaded.`, variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['subtitles', selectedVideoId] })
        onSuccess?.(undefined, file as any)
      } catch (error) {
        setUploadPercent(0)
        onError?.(error as Error)
        notify({ title: 'Upload failed', description: 'Unable to upload subtitle.', variant: 'error' })
      }
    },
  }), [notify, queryClient, selectedVideoId])

  const deleteMutation = useMutation({
    mutationFn: deleteSubtitle,
    onSuccess: () => {
      notify({ title: 'Subtitle removed', description: 'Subtitle deleted.', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['subtitles', selectedVideoId] })
    },
    onError: () => notify({ title: 'Delete failed', description: 'Unable to delete subtitle.', variant: 'error' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, language, label }: EditState) => updateSubtitle(id, { language, label }),
    onSuccess: () => {
      notify({ title: 'Subtitle updated', description: 'Changes saved.', variant: 'success' })
      setEditState(null)
      queryClient.invalidateQueries({ queryKey: ['subtitles', selectedVideoId] })
    },
    onError: () => notify({ title: 'Update failed', description: 'Unable to update subtitle.', variant: 'error' }),
  })

  const columns: ColumnsType<Subtitle> = [
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      render: (value: string) => value.toUpperCase(),
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (value?: string | null) => value || '—',
    },
    {
      title: 'File URL',
      dataIndex: 'file_url',
      key: 'file_url',
      render: (value: string) => (
        <Text className="break-all" copyable>
          {value}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => setEditState({ id: record.id, language: record.language, label: record.label ?? '' })}>
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={deleteMutation.isPending && deleteMutation.variables === record.id}
            onClick={() =>
              Modal.confirm({
                title: 'Delete subtitle?',
                content: 'This subtitle will be permanently deleted.',
                okType: 'danger',
                okText: 'Delete',
                onOk: () => deleteMutation.mutate(record.id),
              })
            }
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Subtitle manager</h1>
        <p className="text-gray-400">Upload, edit, and remove timed-text tracks for each video.</p>
      </header>

      <Card className="glass-panel" bodyStyle={{ padding: 24 }}>
        <Space direction="vertical" className="w-full" size="large">
          <Select
            showSearch
            placeholder="Select a video"
            value={selectedVideoId}
            onChange={(value) => setSelectedVideoId(value)}
            style={{ width: '100%' }}
            loading={videosQuery.isLoading}
            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            options={(videosQuery.data?.items ?? []).map((video: Video) => ({ value: video.id, label: video.title }))}
          />

          <Upload.Dragger {...uploadProps} disabled={!selectedVideoId} className="bg-transparent text-gray-300">
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag subtitles here (.srt / .vtt)</p>
            <p className="ant-upload-hint">Automatically associates with the selected video.</p>
            {uploadPercent > 0 && <Text className="mt-2 block text-primary">Uploading… {uploadPercent}%</Text>}
          </Upload.Dragger>

          <Table<Subtitle>
            rowKey={(record) => record.id}
            columns={columns}
            loading={subtitlesQuery.isLoading}
            dataSource={subtitlesQuery.data ?? []}
            pagination={false}
            locale={{ emptyText: selectedVideoId ? 'No subtitles uploaded' : 'Select a video to manage subtitles' }}
            className="glass-panel"
          />
        </Space>
      </Card>

      <Modal
        open={Boolean(editState)}
        title="Edit subtitle"
        okText="Save changes"
        cancelText="Cancel"
        onCancel={() => setEditState(null)}
        onOk={() => editState && updateMutation.mutate(editState)}
        confirmLoading={updateMutation.isPending}
      >
        {editState && (
          <Form layout="vertical">
            <Form.Item label="Language">
              <Select
                value={editState.language}
                onChange={(value) => setEditState((prev) => (prev ? { ...prev, language: value } : prev))}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'ar', label: 'Arabic' },
                  { value: 'de', label: 'German' },
                  { value: 'hi', label: 'Hindi' },
                  { value: 'custom', label: 'Custom code' },
                ]}
              />
            </Form.Item>
            <Form.Item label="Label">
              <Input value={editState.label} onChange={(event) => setEditState((prev) => (prev ? { ...prev, label: event.target.value } : prev))} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}
