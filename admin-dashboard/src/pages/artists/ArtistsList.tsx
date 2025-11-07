import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { Avatar, Button, Input, Modal, Select, Space, Table, Tag, Tooltip } from 'antd'
import { EditOutlined, PlusOutlined, ReloadOutlined, StopOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'

import type { Artist } from '../../types/content'
import {
  bulkDelete,
  bulkUpdateArtists,
  deleteArtist,
  fetchArtists,
  updateArtist,
} from '../../services/contentService'
import { useNotifications } from '../../contexts/NotificationContext'

interface TableFilters {
  search?: string
  status?: 'active' | 'inactive'
}

const DEFAULT_PAGE_SIZE = 10

export default function ArtistsList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: DEFAULT_PAGE_SIZE })
  const [filters, setFilters] = useState<TableFilters>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const artistsQuery = useQuery({
    queryKey: ['artists', pagination.current, pagination.pageSize, filters],
    queryFn: async () => {
      const response = await fetchArtists({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: filters.search,
        status: filters.status,
      })
      return response
    },
    keepPreviousData: true,
  })

  const refreshTable = () => {
    queryClient.invalidateQueries({ queryKey: ['artists'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteArtist,
    onSuccess: () => {
      notify({ title: 'Artist deleted', description: 'Artist removed permanently.', variant: 'success' })
      setSelectedRowKeys([])
      refreshTable()
    },
    onError: () => notify({ title: 'Delete failed', description: 'Unable to delete artist.', variant: 'error' }),
  })

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      await bulkUpdateArtists(ids, { is_active })
    },
    onSuccess: () => {
      notify({ title: 'Status updated', description: 'Artist status updated.', variant: 'success' })
      setSelectedRowKeys([])
      refreshTable()
    },
    onError: () => notify({ title: 'Update failed', description: 'Unable to change status.', variant: 'error' }),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => bulkDelete(ids, deleteArtist),
    onSuccess: () => {
      notify({ title: 'Artists deleted', description: 'Selected artists removed.', variant: 'success' })
      setSelectedRowKeys([])
      refreshTable()
    },
    onError: () => notify({ title: 'Delete failed', description: 'Unable to delete selected artists.', variant: 'error' }),
  })

  const columns: ColumnsType<Artist> = useMemo(
    () => [
      {
        title: 'Artist',
        dataIndex: 'name',
        key: 'name',
        render: (_value, record) => (
          <Space size="middle">
            <Avatar src={record.profile_image_url} alt={record.name}>
              {record.name?.[0]?.toUpperCase()}
            </Avatar>
            <span className="font-medium text-white">{record.name}</span>
          </Space>
        ),
      },
      {
        title: 'Slug',
        dataIndex: 'slug',
        key: 'slug',
        render: (value: string) => <code className="text-xs text-gray-400">{value}</code>,
      },
      {
        title: 'Bio',
        dataIndex: 'bio',
        key: 'bio',
        ellipsis: true,
        render: (value?: string) => (value ? <Tooltip title={value}>{value.slice(0, 80)}{value.length > 80 ? '…' : ''}</Tooltip> : <span className="text-gray-400">—</span>),
      },
      {
        title: 'Featured',
        dataIndex: 'is_featured',
        key: 'featured',
        render: (value: boolean) => (value ? <Tag color="gold">Featured</Tag> : <span className="text-gray-400">—</span>),
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'status',
        render: (value: boolean) => (
          <Tag color={value ? 'success' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/artists/${record.id}/edit`)}
              size="small"
            >
              Edit
            </Button>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending && deleteMutation.variables === record.id}
              onClick={() =>
                Modal.confirm({
                  title: `Delete ${record.name}?`,
                  content: 'This action cannot be undone.',
                  okText: 'Delete',
                  okType: 'danger',
                  onOk: () => deleteMutation.mutate(record.id),
                })
              }
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    [deleteMutation, navigate],
  )

  const handleTableChange = (nextPagination: TablePaginationConfig) => {
    setPagination(nextPagination)
  }

  const handleBulkDelete = () => {
    Modal.confirm({
      title: `Delete ${selectedRowKeys.length} artist(s)?`,
      content: 'Selected artists will be deleted permanently.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => bulkDeleteMutation.mutate(selectedRowKeys as string[]),
    })
  }

  const hasSelection = selectedRowKeys.length > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Artists</h1>
          <p className="text-gray-400">Manage performer profiles, bios, and availability.</p>
        </div>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search artists"
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value || undefined }))}
            style={{ width: 220 }}
            enterButton
          />
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value as TableFilters['status'] }))}
          />
          <Button icon={<ReloadOutlined />} onClick={refreshTable} loading={artistsQuery.isFetching}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/artists/new')}>
            Add artist
          </Button>
        </Space>
      </header>

      {hasSelection && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-gray-700 bg-gray-900/70 px-4 py-3 text-sm text-gray-200">
          <span>{selectedRowKeys.length} selected</span>
          <Space wrap>
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => bulkStatusMutation.mutate({ ids: selectedRowKeys as string[], is_active: true })}
              loading={bulkStatusMutation.isPending}
            >
              Set active
            </Button>
            <Button
              size="small"
              icon={<StopOutlined />}
              onClick={() => bulkStatusMutation.mutate({ ids: selectedRowKeys as string[], is_active: false })}
              loading={bulkStatusMutation.isPending}
            >
              Set inactive
            </Button>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleBulkDelete}
              loading={bulkDeleteMutation.isPending}
            >
              Delete
            </Button>
          </Space>
        </div>
      )}

      <Table<Artist>
        rowKey={(record) => record.id}
        loading={artistsQuery.isLoading}
        columns={columns}
        dataSource={artistsQuery.data?.items ?? []}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: artistsQuery.data?.pagination.total ?? 0,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        scroll={{ x: true }}
        className="glass-panel"
      />
    </div>
  )
}
