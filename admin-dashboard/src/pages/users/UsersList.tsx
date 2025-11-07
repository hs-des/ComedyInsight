import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { Button, Card, Input, Modal, Select, Space, Table, Tag } from 'antd'
import { DeleteOutlined, EditOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons'

import { fetchUsers, bulkUpdateUsers } from '../../services/userService'
import { fetchSubscriptionPlans } from '../../services/monetizationService'
import type { UserSummary } from '../../types/users'
import { useNotifications } from '../../contexts/NotificationContext'

interface FiltersState {
  search?: string
  status?: 'active' | 'inactive' | 'pending'
  subscriptionStatus?: 'active' | 'expired' | 'canceled' | 'trial'
  planId?: string
}

const DEFAULT_PAGE_SIZE = 20

export default function UsersList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const [filters, setFilters] = useState<FiltersState>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const usersQuery = useQuery({
    queryKey: ['users', page, pageSize, filters],
    queryFn: () =>
      fetchUsers({
        page,
        pageSize,
        search: filters.search,
        status: filters.status,
        planId: filters.planId,
        subscriptionStatus: filters.subscriptionStatus,
      }),
    keepPreviousData: true,
  })

  const plansQuery = useQuery({
    queryKey: ['monetization', 'subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  })

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, is_active }: { ids: string[]; is_active: boolean }) =>
      bulkUpdateUsers(ids, { is_active }),
    onSuccess: () => {
      notify({ title: 'Users updated', description: 'Status updated successfully.', variant: 'success' })
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) =>
      notify({ title: 'Update failed', description: error?.response?.data?.message ?? 'Unable to update users.', variant: 'error' }),
  })

  const columns: ColumnsType<UserSummary> = useMemo(
    () => [
      {
        title: 'User',
        dataIndex: 'full_name',
        key: 'full_name',
        render: (_value, record) => (
          <div className="flex flex-col">
            <span className="font-semibold text-white">{record.full_name || 'Unnamed'}</span>
            <span className="text-xs text-gray-400">{record.email || 'No email'}</span>
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'status',
        render: (_value, record) => (
          <Space size={4}>
            <Tag color={record.is_active ? 'green' : 'default'}>{record.is_active ? 'Active' : 'Inactive'}</Tag>
            {record.is_verified && <Tag color="blue">Verified</Tag>}
          </Space>
        ),
      },
      {
        title: 'Plan',
        dataIndex: 'plan_name',
        key: 'plan',
        render: (value: string | null | undefined) => (value ? value : <span className="text-gray-400 text-sm">Free tier</span>),
      },
      {
        title: 'Subscription',
        dataIndex: 'subscription_status',
        key: 'subscription_status',
        render: (status: string | undefined) => {
          if (!status) return <span className="text-gray-400 text-sm">—</span>
          const colorMap: Record<string, string> = {
            active: 'green',
            trial: 'processing',
            expired: 'red',
            canceled: 'purple',
          }
          return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
        },
      },
      {
        title: 'Joined',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (value: string) => new Date(value).toLocaleDateString(),
      },
      {
        title: 'Last seen',
        dataIndex: 'last_seen_at',
        key: 'last_seen_at',
        render: (value?: string | null) => (value ? new Date(value).toLocaleString() : '—'),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/users/${record.id}`)}>
              Details
            </Button>
          </Space>
        ),
      },
    ],
    [navigate],
  )

  const handleBulkStatus = (is_active: boolean) => {
    if (!selectedRowKeys.length) return
    bulkStatusMutation.mutate({ ids: selectedRowKeys as string[], is_active })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Directory</h1>
          <p className="text-gray-400">Search, filter, and govern ComedyInsight members.</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
            Refresh
          </Button>
          <Button icon={<UserOutlined />} onClick={() => navigate('/users/add')}>
            Invite User
          </Button>
        </Space>
      </header>

      <Card className="bg-gray-900/60 border border-gray-800" bodyStyle={{ padding: 16 }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input.Search
            allowClear
            placeholder="Search by name or email"
            onSearch={(value) => {
              setFilters((prev) => ({ ...prev, search: value || undefined }))
              setPage(1)
            }}
            style={{ width: 280 }}
          />
          <Space wrap>
            <Select
              allowClear
              placeholder="Status"
              style={{ width: 160 }}
              value={filters.status}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, status: value || undefined }))
                setPage(1)
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
            <Select
              allowClear
              placeholder="Subscription status"
              style={{ width: 200 }}
              value={filters.subscriptionStatus}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, subscriptionStatus: value || undefined }))
                setPage(1)
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'trial', label: 'Trial' },
                { value: 'expired', label: 'Expired' },
                { value: 'canceled', label: 'Canceled' },
              ]}
            />
            <Select
              allowClear
              loading={plansQuery.isLoading}
              placeholder="Plan"
              style={{ width: 220 }}
              value={filters.planId}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, planId: value || undefined }))
                setPage(1)
              }}
              options={(plansQuery.data ?? []).map((plan) => ({ value: plan.id, label: plan.name }))}
            />
          </Space>
        </div>

        {selectedRowKeys.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-gray-700 bg-gray-900/70 px-4 py-3 text-sm text-gray-200">
            <span>{selectedRowKeys.length} selected</span>
            <Space>
              <Button size="small" onClick={() => handleBulkStatus(true)} loading={bulkStatusMutation.isPending}>
                Activate
              </Button>
              <Button size="small" danger onClick={() => handleBulkStatus(false)} loading={bulkStatusMutation.isPending}>
                Deactivate
              </Button>
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={() =>
                  Modal.confirm({
                    title: `Deactivate ${selectedRowKeys.length} user(s)?`,
                    content: 'Users will no longer have access until reactivated.',
                    okType: 'danger',
                    onOk: () => handleBulkStatus(false),
                  })
                }
              >
                Disable access
              </Button>
            </Space>
          </div>
        )}

        <Table<UserSummary>
          className="mt-4"
          columns={columns}
          rowKey={(record) => record.id}
          dataSource={usersQuery.data?.items ?? []}
          loading={usersQuery.isLoading}
          pagination={{
            current: page,
            pageSize,
            total: usersQuery.data?.pagination.total ?? 0,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage)
              setPageSize(nextSize ?? DEFAULT_PAGE_SIZE)
            },
          }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        />
      </Card>
    </div>
  )
}

