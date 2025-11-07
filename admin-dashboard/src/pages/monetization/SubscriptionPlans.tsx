import { useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Modal, Space, Table, Tag, Typography, Input, Select, InputNumber, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'

import {
  fetchSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from '../../services/monetizationService'
import type { SubscriptionPlan, SubscriptionPlanFormValues, BillingInterval } from '../../types/monetization'
import { useNotifications } from '../../contexts/NotificationContext'

const { Text } = Typography

const BILLING_INTERVAL_OPTIONS: Array<{ value: BillingInterval; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'SAR', 'AED'].map((currency) => ({ value: currency, label: currency }))

const DEFAULT_FORM_VALUES: SubscriptionPlanFormValues = {
  name: '',
  description: '',
  price_cents: 999,
  currency: 'USD',
  billing_interval: 'monthly',
  trial_days: 7,
  is_active: true,
  features: [],
}

export default function SubscriptionPlans() {
  const queryClient = useQueryClient()
  const { notify } = useNotifications()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  const plansQuery = useQuery({
    queryKey: ['monetization', 'subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionPlanFormValues>({ defaultValues: DEFAULT_FORM_VALUES })

  const openModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan)
      reset({
        name: plan.name,
        description: (plan.metadata?.description as string) ?? plan.description ?? '',
        price_cents: plan.price_cents,
        currency: plan.currency,
        billing_interval: plan.billing_interval,
        trial_days: plan.trial_days,
        is_active: plan.is_active,
        features: (plan.metadata?.features as string[]) ?? [],
      })
    } else {
      setEditingPlan(null)
      reset(DEFAULT_FORM_VALUES)
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPlan(null)
  }

  const createMutation = useMutation({
    mutationFn: createSubscriptionPlan,
    onSuccess: () => {
      notify({ title: 'Plan created', description: 'Subscription plan added successfully.', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['monetization', 'subscription-plans'] })
      closeModal()
    },
    onError: (error: any) =>
      notify({ title: 'Create failed', description: error?.response?.data?.message ?? 'Unable to create plan.', variant: 'error' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SubscriptionPlanFormValues> }) =>
      updateSubscriptionPlan(id, payload),
    onSuccess: () => {
      notify({ title: 'Plan updated', description: 'Subscription plan updated successfully.', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['monetization', 'subscription-plans'] })
      closeModal()
    },
    onError: (error: any) =>
      notify({ title: 'Update failed', description: error?.response?.data?.message ?? 'Unable to update plan.', variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: () => {
      notify({ title: 'Plan deleted', description: 'Subscription plan removed.', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['monetization', 'subscription-plans'] })
    },
    onError: (error: any) =>
      notify({ title: 'Delete failed', description: error?.response?.data?.message ?? 'Unable to delete plan.', variant: 'error' }),
  })

  const onSubmit = handleSubmit((values) => {
    const payload = {
      name: values.name,
      description: values.description,
      price_cents: values.price_cents,
      currency: values.currency,
      billing_interval: values.billing_interval,
      trial_days: values.trial_days,
      is_active: values.is_active,
      metadata: {
        features: values.features.filter(Boolean),
      },
    }

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, payload })
    } else {
      createMutation.mutate(payload as unknown as SubscriptionPlanFormValues)
    }
  })

  const columns: ColumnsType<SubscriptionPlan> = useMemo(
    () => [
      {
        title: 'Plan',
        dataIndex: 'name',
        key: 'name',
        render: (_value, record) => (
          <div className="flex flex-col">
            <span className="font-semibold text-white">{record.name}</span>
            <span className="text-xs text-gray-400">{record.description}</span>
          </div>
        ),
      },
      {
        title: 'Price',
        dataIndex: 'price_cents',
        key: 'price',
        render: (value: number, record) => (
          <span className="text-gray-200 font-medium">
            {(value / 100).toLocaleString(undefined, { style: 'currency', currency: record.currency })}
          </span>
        ),
      },
      {
        title: 'Interval',
        dataIndex: 'billing_interval',
        key: 'interval',
        render: (value: BillingInterval) => <Tag color="geekblue">{value}</Tag>,
      },
      {
        title: 'Trial',
        dataIndex: 'trial_days',
        key: 'trial',
        render: (days: number) => (days ? `${days} days` : 'No trial'),
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'status',
        render: (active: boolean) => (
          <Tag color={active ? 'success' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
        ),
      },
      {
        title: 'Features',
        dataIndex: 'metadata',
        key: 'features',
        render: (metadata: Record<string, unknown>) => {
          const features = (metadata?.features as string[]) ?? []
          if (!features.length) return <span className="text-gray-400 text-sm">—</span>
          return (
            <Space size={[4, 4]} wrap>
              {features.map((feature) => (
                <Tag key={feature} color="purple">
                  {feature}
                </Tag>
              ))}
            </Space>
          )
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button icon={<EditOutlined />} size="small" onClick={() => openModal(record)}>
              Edit
            </Button>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
              onClick={() =>
                Modal.confirm({
                  icon: <ExclamationCircleOutlined />,
                  title: `Delete ${record.name}?`,
                  content: 'This plan will be removed and existing subscribers will retain their status until expiry.',
                  okText: 'Delete plan',
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
    [deleteMutation],
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscription Plans</h1>
          <p className="text-gray-400">Curate pricing tiers, trial windows, and feature sets for ComedyInsight members.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          New Plan
        </Button>
      </header>

      <Card className="bg-gray-900/60 border border-gray-800" bodyStyle={{ padding: 0 }}>
        <Table<SubscriptionPlan>
          columns={columns}
          loading={plansQuery.isLoading}
          dataSource={plansQuery.data ?? []}
          rowKey={(record) => record.id}
          pagination={false}
          className="subscription-plan-table"
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        okText={editingPlan ? 'Save changes' : 'Create plan'}
        cancelText="Cancel"
        onOk={onSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending || isSubmitting}
        onCancel={closeModal}
        width={720}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-300">Plan name</label>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Plan name is required' }}
              render={({ field }) => <Input {...field} placeholder="Premium" />}
            />
            {errors.name && <Text type="danger">{errors.name.message}</Text>}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-300">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Input.TextArea {...field} rows={3} placeholder="Describe benefits for marketing copy" />}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Price (in cents)</label>
            <Controller
              name="price_cents"
              control={control}
              rules={{ required: 'Price is required', min: { value: 199, message: 'Minimum price is $1.99' } }}
              render={({ field }) => (
                <InputNumber
                  min={199}
                  step={100}
                  className="w-full"
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? 199)}
                />
              )}
            />
            {errors.price_cents && <Text type="danger">{errors.price_cents.message}</Text>}
          </div>
          <div>
            <label className="text-sm text-gray-300">Currency</label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={CURRENCY_OPTIONS}
                  showSearch
                />
              )}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Billing interval</label>
            <Controller
              name="billing_interval"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onChange={field.onChange} options={BILLING_INTERVAL_OPTIONS} />
              )}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Trial days</label>
            <Controller
              name="trial_days"
              control={control}
              render={({ field }) => (
                <InputNumber
                  min={0}
                  max={60}
                  className="w-full"
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? 0)}
                />
              )}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Features</label>
            <Controller
              name="features"
              control={control}
              render={({ field }) => (
                <Select
                  mode="tags"
                  tokenSeparators={[',']}
                  placeholder="Add feature bullet points"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className="text-sm text-gray-300">Active</label>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

