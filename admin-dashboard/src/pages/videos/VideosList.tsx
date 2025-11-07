import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  Avatar,
  Button,
  Dropdown,
  Input,
  MenuProps,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons'

import type { Artist, Category, Video, VideoStatus } from '../../types/content'
import {
  bulkDelete,
  bulkUpdateVideos,
  deleteVideo,
  fetchArtists,
  fetchCategories,
  fetchVideos,
  updateVideo,
} from '../../services/contentService'
import { useNotifications } from '../../contexts/NotificationContext'

interface Filters {
  search?: string
  status?: VideoStatus | 'all'
  artistId?: string
  categoryId?: string
}

const STATUS_COLORS: Record<VideoStatus, string> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
}

const DEFAULT_PAGE_SIZE = 10

export default function VideosList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: DEFAULT_PAGE_SIZE })
  const [filters, setFilters] = useState<Filters>({ status: 'all' })
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])

  const videosQuery = useQuery({
    queryKey: ['videos', pagination.current, pagination.pageSize, filters],
    queryFn: () =>
      fetchVideos({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: filters.search,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        artistId: filters.artistId,
        categoryId: filters.categoryId,
      }),
    keepPreviousData: true,
  })

  const artistsQuery = useQuery({
    queryKey: ['video-filter-artists'],
    queryFn: () => fetchArtists({ page: 1, pageSize: 200 }),
  })

  const categoriesQuery = useQuery({
    queryKey: ['video-filter-categories'],
    queryFn: () => fetchCategories({ page: 1, pageSize: 200 }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['videos'] })

  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      notify({ title: 'Video deleted', description: 'Video removed from catalogue.', variant: 'success' })
      setSelectedKeys([])
      refresh()
    },
    onError: () => notify({ title: 'Delete failed', description: 'Unable to delete video.', variant: 'error' }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VideoStatus }) => updateVideo(id, { status }),
    onSuccess: () => {
      notify({ title: 'Status updated', description: 'Video status changed.', variant: 'success' })
      refresh()
    },
    onError: () => notify({ title: 'Update failed', description: 'Unable to change status.', variant: 'error' }),
  })

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: VideoStatus }) => bulkUpdateVideos(ids, { status }),
    onSuccess: () => {
      notify({ title: 'Videos updated', description: 'Status updated for selected videos.', variant: 'success' })
      setSelectedKeys([])
      refresh()
    },
    onError: () => notify({ title: 'Update failed', description: 'Unable to update selected videos.', variant: 'error' }),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDelete(ids, deleteVideo),
    onSuccess: () => {
      notify({ title: 'Videos deleted', description: 'Selected videos removed.', variant: 'success' })
      setSelectedKeys([])
      refresh()
    },
    onError: () => notify({ title: 'Delete failed', description: 'Unable to delete selected videos.', variant: 'error' }),
  })

  const statusMenu = (record: Video): MenuProps['items'] => [
    {
      key: 'published',
      icon: <PlayCircleOutlined />,
      label: 'Publish',
      onClick: () => statusMutation.mutate({ id: record.id, status: 'published' }),
    },
    {
      key: 'draft',
      icon: <PauseCircleOutlined />,
      label: 'Mark as draft',
      onClick: () => statusMutation.mutate({ id: record.id, status: 'draft' }),
    },
    {
      key: 'archived',
      icon: <StopOutlined />,
      label: 'Archive',
      onClick: () => statusMutation.mutate({ id: record.id, status: 'archived' }),
    },
  ]

  const columns: ColumnsType<Video> = useMemo(
    () => [
      {
        title: 'Video',
        dataIndex: 'title',
        key: 'title',
        render: (_value, record) => (
          <Space>
            <Avatar shape="square" size={64} src={record.thumbnail_url}>
              {record.title[0]?.toUpperCase()}
            </Avatar>
            <div>
              <div className="font-semibold text-white">{record.title}</div>
              <div className="text-xs text-gray-400">{record.slug}</div>
              <div className="text-xs text-gray-500">{record.artists.map((artist) => artist.name).join(', ') || 'No artists'}</div>
            </div>
          </Space>
        ),
      },
      {
        title: 'Categories',
        dataIndex: 'categories',
        key: 'categories',
        render: (_value, record) => (
          <Space size={[4, 4]} wrap>
            {record.categories.map((category) => (
              <Tag key={category.id} color="purple">
                {category.name}
              </Tag>
            )) || <span className="text-gray-400">—</span>}
          </Space>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: VideoStatus) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
      },
      {
        title: 'Duration',
        dataIndex: 'duration_seconds',
        key: 'duration',
        render: (value?: number | null) => (value ? `${Math.floor(value / 60)}m ${value % 60}s` : '—'),
      },
      {
        title: 'Release',
        dataIndex: 'release_date',
        key: 'release',
        render: (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—'),
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 160,
        render: (_, record) => (
          <Space>
            <Dropdown menu={{ items: statusMenu(record) }} trigger={['click']}>
              <Button>Change status</Button>
            </Dropdown>
            <Tooltip title="Preview">
              <Button
                icon={<EyeOutlined />}
                disabled={!record.video_url}
                onClick={() => record.video_url && window.open(record.video_url, '_blank', 'noopener')}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/videos/${record.id}/edit`)} />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                onClick={() =>
                  Modal.confirm({
                    title: `Delete ${record.title}?`,
                    content: 'This will remove the video and all metadata.',
                    okType: 'danger',
                    okText: 'Delete',
                    onOk: () => deleteMutation.mutate(record.id),
                  })
                }
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [deleteMutation, navigate]
  )

  const onTableChange = (nextPagination: TablePaginationConfig) => setPagination(nextPagination)

  const selectedCount = selectedKeys.length

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Videos</h1>
          <p className="text-gray-400">Manage uploads, metadata, availability, and publishing state.</p>
        </div>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search videos"
            enterButton
            style={{ width: 240 }}
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value || undefined }))}
          />
          <Select
            value={filters.status}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All status' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archived' },
            ]}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value as Filters['status'] }))}
          />
          <Select
            allowClear
            placeholder="Filter by artist"
            loading={artistsQuery.isLoading}
            style={{ width: 200 }}
            options={(artistsQuery.data?.items ?? []).map((artist: Artist) => ({ value: artist.id, label: artist.name }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, artistId: value || undefined }))}
          />
          <Select
            allowClear
            placeholder="Filter by category"
            loading={categoriesQuery.isLoading}
            style={{ width: 220 }}
            options={(categoriesQuery.data?.items ?? []).map((category: Category) => ({ value: category.id, label: category.name }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, categoryId: value || undefined }))}
          />
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={videosQuery.isFetching}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/videos/upload')}>
            Upload video
          </Button>
        </Space>
      </header>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-gray-700 bg-gray-900/70 px-4 py-3 text-sm text-gray-200">
          <span>{selectedCount} selected</span>
          <Space wrap>
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              loading={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate({ ids: selectedKeys as string[], status: 'published' })}
            >
              Publish
            </Button>
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              loading={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate({ ids: selectedKeys as string[], status: 'draft' })}
            >
              Mark draft
            </Button>
            <Button
              size="small"
              icon={<StopOutlined />}
              loading={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate({ ids: selectedKeys as string[], status: 'archived' })}
            >
              Archive
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={bulkDeleteMutation.isPending}
              onClick={() =>
                Modal.confirm({
                  title: `Delete ${selectedCount} videos?`,
                  content: 'Videos will be permanently deleted.',
                  okType: 'danger',
                  okText: 'Delete',
                  onOk: () => bulkDeleteMutation.mutate(selectedKeys as string[]),
                })
              }
            >
              Delete
            </Button>
          </Space>
        </div>
      )}

      <Table<Video>
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={videosQuery.data?.items ?? []}
        loading={videosQuery.isLoading}
        onChange={onTableChange}
        rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: videosQuery.data?.pagination.total ?? 0,
          showSizeChanger: true,
        }}
        scroll={{ x: 1200 }}
        className="glass-panel"
      />
    </div>
  )
}
