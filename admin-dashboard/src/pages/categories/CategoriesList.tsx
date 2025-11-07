import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { Button, Input, Modal, Select, Space, Table, Tag } from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'

import type { Category } from '../../types/content'
import {
  bulkDelete,
  bulkUpdateCategories,
  deleteCategory,
  fetchCategories,
} from '../../services/contentService'
import { useNotifications } from '../../contexts/NotificationContext'

interface Filters {
  search?: string
  status?: 'active' | 'inactive'
}

const DEFAULT_PAGE_SIZE = 10

export default function CategoriesList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: DEFAULT_PAGE_SIZE })
  const [filters, setFilters] = useState<Filters>({})
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])

  const categoriesQuery = useQuery({
    queryKey: ['categories', pagination.current, pagination.pageSize, filters],
    queryFn: () =>
      fetchCategories({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: filters.search,
        status: filters.status,
      }),
    keepPreviousData: true,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['categories'] })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      notify({ title: 'Category deleted', description: 'Category removed.', variant: 'success' })
      setSelectedKeys([])
      refresh()
    },
    onError: () => notify({ title: 'Delete failed', description: 'Unable to delete category.', variant: 'error' }),
  })

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, is_active }: { ids: string[]; is_active: boolean }) => bulkUpdateCategories(ids, { is_active }),
    onSuccess: () => {
      notify({ title: 'Status updated', description: 'Category status changed.', variant: 'success' })
      setSelectedKeys([])
      refresh()
    },
    onError: () => notify({ title: 'Update failed', description: 'Unable to update categories.', variant: 'error' }),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDelete(ids, deleteCategory),
    onSuccess: () => {
      notify({ title: 'Categories deleted', description: 'Selected categories removed.', variant: 'success' })
      setSelectedKeys([])
      refresh()
    },
    onError: () => notify({ title: 'Delete failed', description: 'Unable to delete selected categories.', variant: 'error' }),
  })

  const columns: ColumnsType<Category> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: (value: string) => <span className="font-medium text-white">{value}</span>,
      },
      {
        title: 'Slug',
        dataIndex: 'slug',
        key: 'slug',
        render: (value: string) => <code className="text-xs text-gray-400">{value}</code>,
      },
      {
        title: 'Parent',
        dataIndex: 'parent_id',
        key: 'parent',
        render: (_value, record) => record.parent_id ? <Tag>{record.parent_id.slice(0, 8)}…</Tag> : <span className="text-gray-400">—</span>,
      },
      {
        title: 'Display order',
        dataIndex: 'display_order',
        key: 'display_order',
        sorter: (a, b) => a.display_order - b.display_order,
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'status',
        render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag>,
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/categories/${record.id}/edit`)}>
              Edit
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending && deleteMutation.variables === record.id}
              onClick={() =>
                Modal.confirm({
                  title: `Delete ${record.name}?`,
                  content: 'This action cannot be undone.',
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
    ],
    [deleteMutation, navigate],
  )

  const onTableChange = (nextPagination: TablePaginationConfig) => {
    setPagination(nextPagination)
  }

  const selectedCount = selectedKeys.length

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <p className="text-gray-400">Organize videos into browseable sections.</p>
        </div>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search categories"
            enterButton
            style={{ width: 220 }}
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value || undefined }))}
          />
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 150 }}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value as Filters['status'] }))}
          />
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={categoriesQuery.isFetching}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/categories/new')}>
            Add category
          </Button>
        </Space>
      </header>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-gray-700 bg-gray-900/70 px-4 py-3 text-sm text-gray-200">
          <span>{selectedCount} selected</span>
          <Space wrap>
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              loading={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate({ ids: selectedKeys as string[], is_active: true })}
            >
              Set active
            </Button>
            <Button
              size="small"
              icon={<StopOutlined />}
              loading={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate({ ids: selectedKeys as string[], is_active: false })}
            >
              Set inactive
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={bulkDeleteMutation.isPending}
              onClick={() =>
                Modal.confirm({
                  title: `Delete ${selectedCount} categories?`,
                  content: 'This will permanently remove the selected categories.',
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

      <Table<Category>
        rowKey={(record) => record.id}
        columns={columns}
        loading={categoriesQuery.isLoading}
        dataSource={categoriesQuery.data?.items ?? []}
        onChange={onTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: categoriesQuery.data?.pagination.total ?? 0,
          showSizeChanger: true,
        }}
        rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        scroll={{ x: true }}
        className="glass-panel"
      />
    </div>
  )
}
