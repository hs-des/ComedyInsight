import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Col, Descriptions, Divider, Form, Input, Row, Select, Space, Switch, Tag, Timeline, Typography } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons'

import {
  fetchUserById,
  updateUser,
  fetchUserSubscription,
  updateUserSubscription,
  fetchUserActivity,
} from '../../services/userService'
import { fetchSubscriptionPlans } from '../../services/monetizationService'
import type { UserProfile, UserSubscription, UserActivityEntry } from '../../types/users'
import { useNotifications } from '../../contexts/NotificationContext'

const { Text } = Typography

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUserById(userId!),
    enabled: Boolean(userId),
  })

  const subscriptionQuery = useQuery({
    queryKey: ['users', userId, 'subscription'],
    queryFn: () => fetchUserSubscription(userId!),
    enabled: Boolean(userId),
  })

  const activityQuery = useQuery({
    queryKey: ['users', userId, 'activity'],
    queryFn: () => fetchUserActivity(userId!),
    enabled: Boolean(userId),
  })

  const plansQuery = useQuery({
    queryKey: ['monetization', 'subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<UserProfile>({})

  const subscriptionForm = useForm<UserSubscription>({})

  useEffect(() => {
    if (userQuery.data) {
      reset(userQuery.data)
    }
  }, [userQuery.data, reset])

  useEffect(() => {
    if (subscriptionQuery.data) {
      subscriptionForm.reset(subscriptionQuery.data)
    }
  }, [subscriptionQuery.data, subscriptionForm])

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserProfile> }) => updateUser(id, payload),
    onSuccess: (data) => {
      notify({ title: 'User updated', description: 'Profile changes saved.', variant: 'success' })
      reset(data)
      queryClient.invalidateQueries({ queryKey: ['users', userId] })
    },
    onError: (error: any) =>
      notify({ title: 'Update failed', description: error?.response?.data?.message ?? 'Unable to update user.', variant: 'error' }),
  })

  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserSubscription> }) =>
      updateUserSubscription(id, {
        plan_id: payload.plan_id,
        status: payload.status,
        expires_at: payload.expires_at,
        renewal_price_cents: payload.renewal_price_cents ?? null,
      }),
    onSuccess: (data) => {
      notify({ title: 'Subscription updated', description: 'User subscription updated.', variant: 'success' })
      subscriptionForm.reset(data)
      queryClient.invalidateQueries({ queryKey: ['users', userId, 'subscription'] })
    },
    onError: (error: any) =>
      notify({ title: 'Update failed', description: error?.response?.data?.message ?? 'Unable to update subscription.', variant: 'error' }),
  })

  const handleSaveProfile = handleSubmit((values) => {
    if (!userId) return
    updateUserMutation.mutate({ id: userId, payload: values })
  })

  const handleSaveSubscription = subscriptionForm.handleSubmit((values) => {
    if (!userId) return
    updateSubscriptionMutation.mutate({ id: userId, payload: values })
  })

  const renderActivityItem = (entry: UserActivityEntry) => (
    <Timeline.Item key={entry.id} color="cyan">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-white">{entry.description}</span>
        <span className="text-xs text-gray-400">{new Date(entry.occurred_at).toLocaleString()}</span>
      </div>
    </Timeline.Item>
  )

  if (!userId) {
    return <div className="text-gray-400">No user selected.</div>
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">User Details</h1>
          <p className="text-gray-400">View account profile, subscription status, and recent activity.</p>
        </div>
      </header>

      <Row gutter={[24, 24]}>
        <Col xl={16} lg={24}>
          <Card className="bg-gray-900/60 border border-gray-800" title="Profile">
            <Form layout="vertical" onFinish={handleSaveProfile}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Full name">
                    <Controller
                      name="full_name"
                      control={control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email">
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => <Input {...field} disabled />}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Phone number">
                    <Controller
                      name="phone_number"
                      control={control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Country">
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="Active">
                    <Controller
                      name="is_active"
                      control={control}
                      render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Verified">
                    <Controller
                      name="is_verified"
                      control={control}
                      render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={() => userQuery.refetch()}>
                  Reset
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  htmlType="submit"
                  loading={updateUserMutation.isPending}
                  disabled={!isDirty}
                >
                  Save Profile
                </Button>
              </Space>
            </Form>
          </Card>

          <Card className="bg-gray-900/60 border border-gray-800" title="Recent Activity" loading={activityQuery.isLoading}>
            {activityQuery.data && activityQuery.data.length > 0 ? (
              <Timeline>{activityQuery.data.map(renderActivityItem)}</Timeline>
            ) : (
              <Text type="secondary">No recent activity recorded.</Text>
            )}
          </Card>
        </Col>

        <Col xl={8} lg={24}>
          <Card className="bg-gray-900/60 border border-gray-800" title="Account Overview" loading={userQuery.isLoading}>
            {userQuery.data && (
              <Descriptions column={1} title={null} size="small">
                <Descriptions.Item label="User ID">{userQuery.data.id}</Descriptions.Item>
                <Descriptions.Item label="Joined">{new Date(userQuery.data.created_at).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Last seen">
                  {userQuery.data.last_seen_at ? new Date(userQuery.data.last_seen_at).toLocaleString() : 'Never'}
                </Descriptions.Item>
                <Descriptions.Item label="Roles">
                  {userQuery.data.roles && userQuery.data.roles.length ? (
                    <Space>
                      {userQuery.data.roles.map((role) => (
                        <Tag key={role} color="geekblue">
                          {role}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    'Standard user'
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>

          <Card className="bg-gray-900/60 border border-gray-800" title="Subscription" loading={subscriptionQuery.isLoading}>
            <Form layout="vertical" onFinish={handleSaveSubscription}>
              <Form.Item label="Plan">
                <Controller
                  name="plan_id"
                  control={subscriptionForm.control}
                  render={({ field }) => (
                    <Select
                      allowClear
                      placeholder="Assign plan"
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      loading={plansQuery.isLoading}
                      options={(plansQuery.data ?? []).map((plan) => ({ value: plan.id, label: plan.name }))}
                    />
                  )}
                />
              </Form.Item>
              <Form.Item label="Status">
                <Controller
                  name="status"
                  control={subscriptionForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'trial', label: 'Trial' },
                        { value: 'expired', label: 'Expired' },
                        { value: 'canceled', label: 'Canceled' },
                      ]}
                    />
                  )}
                />
              </Form.Item>
              <Form.Item label="Renewal price (cents)">
                <Controller
                  name="renewal_price_cents"
                  control={subscriptionForm.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                      placeholder="Leave blank to keep current"
                    />
                  )}
                />
              </Form.Item>
              <Form.Item label="Expires at">
                <Controller
                  name="expires_at"
                  control={subscriptionForm.control}
                  render={({ field }) => (
                    <Input type="datetime-local" value={field.value ?? ''} onChange={field.onChange} />
                  )}
                />
              </Form.Item>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={() => subscriptionQuery.refetch()}>
                  Reset
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  htmlType="submit"
                  loading={updateSubscriptionMutation.isPending}
                >
                  Save Subscription
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>
      </Row>

      <Divider />
      <Card className="bg-gray-900/60 border border-gray-800" title="Technical metadata" loading={userQuery.isLoading}>
        {userQuery.data ? (
          <pre className="max-h-72 overflow-auto rounded-lg bg-gray-950/70 p-4 text-xs text-gray-300">
            {JSON.stringify(userQuery.data.preferences ?? {}, null, 2)}
          </pre>
        ) : (
          <Text type="secondary">Preferences unavailable.</Text>
        )}
      </Card>
    </div>
  )
}

