import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Col, Divider, Input, InputNumber, Row, Space, Statistic, Switch, Tooltip } from 'antd'
import { CheckCircleOutlined, ReloadOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from '@ant-design/icons'

import {
  fetchAdMobSettings,
  updateAdMobSettings,
  testAdMobAdUnit,
  fetchAdMobAnalytics,
} from '../../services/monetizationService'
import type { AdMobSettings } from '../../types/monetization'
import { useNotifications } from '../../contexts/NotificationContext'

const AD_TYPES: Array<{ key: keyof AdMobSettings; label: string; platform: 'Android' | 'iOS'; hint: string }> = [
  { key: 'bannerAndroid', label: 'Banner (Android)', platform: 'Android', hint: 'ca-app-pub-xxxxxxxxxxxxxxxx/banner' },
  { key: 'bannerIos', label: 'Banner (iOS)', platform: 'iOS', hint: 'ca-app-pub-xxxxxxxxxxxxxxxx/banner' },
  { key: 'interstitialAndroid', label: 'Interstitial (Android)', platform: 'Android', hint: 'ca-app-pub-xxxxxxxxxxxxxxxx/interstitial' },
  { key: 'interstitialIos', label: 'Interstitial (iOS)', platform: 'iOS', hint: 'ca-app-pub-xxxxxxxxxxxxxxxx/interstitial' },
  { key: 'rewardedAndroid', label: 'Rewarded (Android)', platform: 'Android', hint: 'ca-app-pub-xxxxxxxxxxxxxxxx/rewarded' },
  { key: 'rewardedIos', label: 'Rewarded (iOS)', platform: 'iOS', hint: 'ca-app-pub-xxxxxxxxxxxxxxxx/rewarded' },
  { key: 'appOpenAndroid', label: 'App Open (Android)', platform: 'Android', hint: 'ca-app-pub-xxxxxxxxxxxxxxxx/appopen' },
  { key: 'appOpenIos', label: 'App Open (iOS)', platform: 'iOS', hint: 'ca-app-pub-xxxxxxxxxxxxxxxx/appopen' },
]

const DEFAULT_VALUES: AdMobSettings = {
  bannerAndroid: '',
  bannerIos: '',
  interstitialAndroid: '',
  interstitialIos: '',
  rewardedAndroid: '',
  rewardedIos: '',
  appOpenAndroid: '',
  appOpenIos: '',
  refreshIntervalSeconds: 60,
  showAdsToPremium: false,
}

export default function AdMobSettings() {
  const queryClient = useQueryClient()
  const { notify } = useNotifications()

  const settingsQuery = useQuery({
    queryKey: ['monetization', 'admob', 'settings'],
    queryFn: fetchAdMobSettings,
  })

  const analyticsQuery = useQuery({
    queryKey: ['monetization', 'admob', 'analytics'],
    queryFn: fetchAdMobAnalytics,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<AdMobSettings>({ defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (settingsQuery.data) {
      reset(settingsQuery.data)
    }
  }, [settingsQuery.data, reset])

  const updateMutation = useMutation({
    mutationFn: updateAdMobSettings,
    onSuccess: (data) => {
      notify({ title: 'AdMob settings saved', description: 'Configuration updated successfully.', variant: 'success' })
      reset(data)
      queryClient.invalidateQueries({ queryKey: ['monetization', 'admob', 'analytics'] })
    },
    onError: (error: any) => {
      notify({ title: 'Save failed', description: error?.response?.data?.message ?? 'Unable to save AdMob settings.', variant: 'error' })
    },
  })

  const testMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => testAdMobAdUnit(id, type),
    onSuccess: (response) => {
      notify({
        title: response.success ? 'Ad unit verified' : 'Test failed',
        description: response.message,
        variant: response.success ? 'success' : 'error',
      })
    },
    onError: (error: any) => {
      notify({ title: 'Test failed', description: error?.response?.data?.message ?? 'Unable to test ad unit.', variant: 'error' })
    },
  })

  const onSubmit = handleSubmit((values) => updateMutation.mutate(values))

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">AdMob Integration</h1>
        <p className="text-gray-400">Manage AdMob credentials, refresh rules, and monitor ad monetization performance.</p>
      </header>

      <Row gutter={[24, 24]}>
        <Col xl={16} lg={24}>
          <Card className="bg-gray-900/60 border border-gray-800">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Ad Unit Credentials</h2>
                <p className="text-sm text-gray-400">All ad unit IDs are encrypted server-side and rotated via audit workflow.</p>
              </div>
              <Space>
                <Button
                  icon={<ReloadOutlined spin={settingsQuery.isRefetching} />}
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['monetization', 'admob', 'settings'] })}
                  disabled={settingsQuery.isFetching}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={onSubmit}
                  loading={updateMutation.isPending}
                  disabled={!isDirty}
                >
                  Save Changes
                </Button>
              </Space>
            </div>

            <Divider className="border-gray-800" />

            <form className="grid gap-6 md:grid-cols-2" onSubmit={onSubmit}>
              {AD_TYPES.map((item) => (
                <div key={item.key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    {item.label}
                    <Tooltip title={`Platform: ${item.platform}`}>
                      <SafetyCertificateOutlined />
                    </Tooltip>
                  </label>
                  <Input
                    placeholder={item.hint}
                    {...register(item.key, {
                      required: 'Ad unit ID is required',
                    })}
                    status={errors[item.key] ? 'error' : ''}
                  />
                  {errors[item.key] && <span className="text-xs text-red-400">{errors[item.key]?.message as string}</span>}
                  <Button
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => testMutation.mutate({ id: watch(item.key), type: item.key })}
                    disabled={!watch(item.key) || testMutation.isPending}
                  >
                    Test Ad Unit
                  </Button>
                </div>
              ))}

              <Controller
                name="refreshIntervalSeconds"
                control={control}
                rules={{
                  min: { value: 30, message: 'Minimum refresh is 30 seconds' },
                  max: { value: 600, message: 'Maximum refresh is 600 seconds' },
                  required: 'Refresh interval is required',
                }}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Refresh Interval (seconds)</label>
                    <InputNumber
                      min={30}
                      max={600}
                      className="w-full"
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 60)}
                    />
                    {errors.refreshIntervalSeconds && (
                      <span className="text-xs text-red-400">{errors.refreshIntervalSeconds.message}</span>
                    )}
                  </div>
                )}
              />
              <Controller
                name="showAdsToPremium"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Show Ads to Premium Users</label>
                    <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/70 p-3">
                      <Switch checked={field.value} onChange={field.onChange} />
                      <span className="text-sm text-gray-300">Disable to guarantee ad-free experience for premium plans.</span>
                    </div>
                  </div>
                )}
              />
            </form>
          </Card>
        </Col>

        <Col xl={8} lg={24}>
          <Card className="bg-gray-900/60 border border-gray-800" loading={analyticsQuery.isLoading}>
            <h3 className="text-lg font-semibold text-white mb-3">Revenue Snapshot</h3>
            {analyticsQuery.data ? (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={<span className="text-gray-400">Impressions (24h)</span>}
                    value={analyticsQuery.data.summary.impressionsToday}
                    valueStyle={{ color: '#38bdf8' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={<span className="text-gray-400">Clicks (24h)</span>}
                    value={analyticsQuery.data.summary.clicksToday}
                    valueStyle={{ color: '#f97316' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    prefix="$"
                    precision={2}
                    title={<span className="text-gray-400">Revenue (24h)</span>}
                    value={analyticsQuery.data.summary.revenueToday / 100}
                    valueStyle={{ color: '#34d399' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    suffix="%"
                    precision={2}
                    title={<span className="text-gray-400">Fill Rate</span>}
                    value={analyticsQuery.data.summary.fillRate}
                    valueStyle={{ color: '#c084fc' }}
                  />
                </Col>
              </Row>
            ) : (
              <p className="text-sm text-gray-400">Analytics data unavailable. Ensure the reporting service is online.</p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

