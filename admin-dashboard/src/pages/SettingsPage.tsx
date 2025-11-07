import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchSettings,
  updateStorageSettings,
  testStorageConnection,
  updateTwilioSettings,
  sendTestOtp,
  updateGeneralSettings,
  changePassword,
  toggleTwoFactor,
  createApiKey,
  revokeApiKey,
  fetchApiKeys,
  StorageSettings,
  TwilioSettings,
  GeneralSettings,
  ApiKey,
  StorageTestResponse,
} from '../services/settingsService'
import {
  Cloud,
  Phone,
  Settings as SettingsIcon,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  KeyRound,
  Zap,
  Globe,
  EyeOff,
} from 'lucide-react'
import ThirdPartySettings from './settings/ThirdPartySettings'

type TabKey = 'storage' | 'twilio' | 'integrations' | 'general' | 'security'

interface StorageFormValues extends StorageSettings {}

interface TwilioFormValues extends TwilioSettings {}

interface GeneralFormValues extends GeneralSettings {}

interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>('storage')
  const [storageStatus, setStorageStatus] = useState<{ state: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ state: 'idle' })
  const [otpStatus, setOtpStatus] = useState<{ state: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ state: 'idle' })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [generatedKeySecret, setGeneratedKeySecret] = useState<string | null>(null)

  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const { data: apiKeyData } = useQuery({
    queryKey: ['settings', 'api-keys'],
    queryFn: fetchApiKeys,
  })

  const storageForm = useForm<StorageFormValues>({
    defaultValues: {
      endpoint: '',
      accessKey: '',
      secretKey: '',
      bucket: '',
      region: '',
    },
  })

  const twilioForm = useForm<TwilioFormValues>({
    defaultValues: {
      accountSid: '',
      authToken: '',
      fromNumber: '',
      verifyServiceSid: '',
      otpTemplate: 'Your ComedyInsight verification code is {{code}}',
    },
  })

  const generalForm = useForm<GeneralFormValues>({
    defaultValues: {
      apiBaseUrl: '',
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (settingsData) {
      storageForm.reset({
        endpoint: settingsData.storage.endpoint,
        accessKey: settingsData.storage.accessKey,
        secretKey: settingsData.storage.secretKey,
        bucket: settingsData.storage.bucket,
        region: settingsData.storage.region,
      })
      twilioForm.reset({
        accountSid: settingsData.twilio.accountSid,
        authToken: settingsData.twilio.authToken,
        fromNumber: settingsData.twilio.fromNumber,
        verifyServiceSid: settingsData.twilio.verifyServiceSid,
        otpTemplate: settingsData.twilio.otpTemplate,
      })
      generalForm.reset({
        apiBaseUrl: settingsData.general.apiBaseUrl,
        theme: settingsData.general.theme,
        language: settingsData.general.language,
        notifications: {
          email: settingsData.general.notifications.email,
          sms: settingsData.general.notifications.sms,
          push: settingsData.general.notifications.push,
        },
      })
      setTwoFactorEnabled(settingsData.security.twoFactorEnabled)
      setApiKeys(settingsData.security.apiKeys)
    }
  }, [settingsData, storageForm, twilioForm, generalForm])

  useEffect(() => {
    if (apiKeyData) {
      setApiKeys(apiKeyData)
    }
  }, [apiKeyData])

  const storageMutation = useMutation({
    mutationFn: updateStorageSettings,
    onSuccess: (response) => {
      setStorageStatus({ state: 'success', message: 'Storage settings saved successfully' })
      storageForm.reset(response)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => {
      setStorageStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to save storage settings' })
    },
  })

  const storageTestMutation = useMutation({
    mutationFn: testStorageConnection,
    onSuccess: (response: StorageTestResponse) => {
      setStorageStatus({
        state: response.success ? 'success' : 'error',
        message: response.message || (response.success ? 'Connection successful' : 'Connection failed'),
      })
    },
    onError: (error: any) => {
      setStorageStatus({ state: 'error', message: error?.response?.data?.message || 'Connection test failed' })
    },
  })

  const twilioMutation = useMutation({
    mutationFn: updateTwilioSettings,
    onSuccess: (response) => {
      twilioForm.reset(response)
      setOtpStatus({ state: 'success', message: 'Twilio settings saved successfully' })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => {
      setOtpStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to save Twilio settings' })
    },
  })

  const twilioTestMutation = useMutation({
    mutationFn: sendTestOtp,
    onMutate: () => setOtpStatus({ state: 'testing', message: 'Sending test OTP...' }),
    onSuccess: (response) => {
      setOtpStatus({
        state: response.success ? 'success' : 'error',
        message: response.message,
      })
    },
    onError: (error: any) => {
      setOtpStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to send test OTP' })
    },
  })

  const generalMutation = useMutation({
    mutationFn: updateGeneralSettings,
    onSuccess: (response) => {
      generalForm.reset(response)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      passwordForm.reset()
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const twoFactorMutation = useMutation({
    mutationFn: toggleTwoFactor,
    onSuccess: (response) => {
      setTwoFactorEnabled(response.enabled)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const createKeyMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (response) => {
      setApiKeys((prev) => [response.apiKey, ...prev])
      setGeneratedKeySecret(response.secret)
      setNewApiKeyName('')
      queryClient.invalidateQueries({ queryKey: ['settings', 'api-keys'] })
    },
  })

  const revokeKeyMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: (_, id) => {
      setApiKeys((prev) => prev.filter((key) => key.id !== id))
      queryClient.invalidateQueries({ queryKey: ['settings', 'api-keys'] })
    },
  })

  const tabs = useMemo(
    () => [
      { id: 'storage' as const, label: 'Storage', description: 'Configure S3 / MinIO integration', icon: Cloud },
      { id: 'twilio' as const, label: 'Twilio OTP', description: 'Set up SMS authentication', icon: Phone },
      { id: 'integrations' as const, label: 'Third-Party APIs', description: 'Manage AWS, Twilio, Firebase, OAuth', icon: Zap },
      { id: 'general' as const, label: 'Application', description: 'Global dashboard preferences', icon: SettingsIcon },
      { id: 'security' as const, label: 'Security', description: 'Manage access & API keys', icon: Shield },
    ],
    []
  )

  const renderStatus = (status: typeof storageStatus) => {
    if (status.state === 'idle') return null
    const Icon = status.state === 'success' ? CheckCircle2 : status.state === 'testing' ? Loader2 : XCircle
    const color =
      status.state === 'success'
        ? 'text-emerald-400'
        : status.state === 'testing'
        ? 'text-blue-400 animate-spin'
        : 'text-red-400'
    return (
      <div className="settings-status">
        <Icon size={18} className={color} />
        <span>{status.message}</span>
      </div>
    )
  }

  const onSubmitStorage = storageForm.handleSubmit((values) => {
    setStorageStatus({ state: 'idle' })
    storageMutation.mutate(values)
  })

  const handleTestStorage = () => {
    setStorageStatus({ state: 'testing', message: 'Testing connection...' })
    storageTestMutation.mutate(storageForm.getValues())
  }

  const [testPhoneNumber, setTestPhoneNumber] = useState('')

  const onSubmitTwilio = twilioForm.handleSubmit((values) => {
    setOtpStatus({ state: 'idle' })
    twilioMutation.mutate(values)
  })

  const handleSendTestOtp = () => {
    if (!testPhoneNumber) {
      setOtpStatus({ state: 'error', message: 'Enter a phone number to send a test OTP.' })
      return
    }
    const template = twilioForm.getValues().otpTemplate
    twilioTestMutation.mutate({ phoneNumber: testPhoneNumber, message: template })
  }

  const onSubmitGeneral = generalForm.handleSubmit((values) => {
    generalMutation.mutate(values)
  })

  const onSubmitPassword = passwordForm.handleSubmit((values) => {
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'Passwords do not match' })
      return
    }
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
  })

  const handleToggleTwoFactor = () => {
    twoFactorMutation.mutate(!twoFactorEnabled)
  }

  const handleCreateApiKey = () => {
    if (!newApiKeyName.trim()) return
    createKeyMutation.mutate({ name: newApiKeyName.trim() })
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage integrations, preferences, and security for the ComedyInsight platform.</p>
      </header>

      <div className="settings-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab ${isActive ? 'settings-tab--active' : ''}`}
            >
              <Icon size={18} />
              <div className="text-left">
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs text-gray-400">{tab.description}</div>
              </div>
            </button>
          )
        })}
      </div>

      {isSettingsLoading ? (
        <div className="settings-card flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="ml-3 text-gray-400">Loading settings...</span>
        </div>
      ) : (
        <>
          {activeTab === 'storage' && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">S3 / MinIO Configuration</h2>
                  <p className="settings-card-subtitle">Connect the dashboard to your object storage provider.</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={handleTestStorage} disabled={storageTestMutation.isPending}>
                    {storageTestMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                    Test Connection
                  </button>
                  <button type="button" className="btn-primary" onClick={onSubmitStorage} disabled={storageMutation.isPending}>
                    {storageMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    Save Changes
                  </button>
                </div>
              </div>
              {renderStatus(storageStatus)}
              <form className="settings-form-grid" onSubmit={onSubmitStorage}>
                <div>
                  <label className="settings-label">Endpoint URL</label>
                  <input
                    type="url"
                    className="settings-input"
                    placeholder="https://minio.example.com"
                    {...storageForm.register('endpoint', {
                      required: 'Endpoint is required',
                      pattern: { value: /^https?:\/\//, message: 'Must be a valid URL' },
                    })}
                  />
                  {storageForm.formState.errors.endpoint && <p className="settings-error">{storageForm.formState.errors.endpoint.message}</p>}
                </div>
                <div>
                  <label className="settings-label">Access Key</label>
                  <input
                    type="text"
                    className="settings-input"
                    {...storageForm.register('accessKey', { required: 'Access key is required' })}
                  />
                  {storageForm.formState.errors.accessKey && <p className="settings-error">{storageForm.formState.errors.accessKey.message}</p>}
                </div>
                <div>
                  <label className="settings-label">Secret Key</label>
                  <input
                    type="password"
                    className="settings-input"
                    {...storageForm.register('secretKey', { required: 'Secret key is required', minLength: { value: 8, message: 'Secret must be at least 8 characters' } })}
                  />
                  {storageForm.formState.errors.secretKey && <p className="settings-error">{storageForm.formState.errors.secretKey.message}</p>}
                </div>
                <div>
                  <label className="settings-label">Bucket Name</label>
                  <input
                    type="text"
                    className="settings-input"
                    {...storageForm.register('bucket', { required: 'Bucket name is required' })}
                  />
                  {storageForm.formState.errors.bucket && <p className="settings-error">{storageForm.formState.errors.bucket.message}</p>}
                </div>
                <div>
                  <label className="settings-label">Region</label>
                  <input type="text" className="settings-input" placeholder="us-east-1" {...storageForm.register('region')} />
                </div>
              </form>
            </section>
          )}

          {activeTab === 'twilio' && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Twilio OTP Configuration</h2>
                  <p className="settings-card-subtitle">Handle one-time passwords and SMS verification.</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={handleSendTestOtp} disabled={twilioTestMutation.isPending}>
                    {twilioTestMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Phone size={16} />}
                    Send Test OTP
                  </button>
                  <button type="button" className="btn-primary" onClick={onSubmitTwilio} disabled={twilioMutation.isPending}>
                    {twilioMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    Save Changes
                  </button>
                </div>
              </div>
              {renderStatus(otpStatus)}
              <form className="settings-form-grid" onSubmit={onSubmitTwilio}>
                <div>
                  <label className="settings-label">Account SID</label>
                  <input
                    type="text"
                    className="settings-input"
                    {...twilioForm.register('accountSid', {
                      required: 'Account SID is required',
                      pattern: { value: /^AC[a-zA-Z0-9]{32}$/, message: 'Invalid Account SID format' },
                    })}
                  />
                  {twilioForm.formState.errors.accountSid && <p className="settings-error">{twilioForm.formState.errors.accountSid.message}</p>}
                </div>
                <div>
                  <label className="settings-label">Auth Token</label>
                  <input
                    type="password"
                    className="settings-input"
                    {...twilioForm.register('authToken', { required: 'Auth token is required', minLength: { value: 16, message: 'Auth token must be at least 16 characters' } })}
                  />
                  {twilioForm.formState.errors.authToken && <p className="settings-error">{twilioForm.formState.errors.authToken.message}</p>}
                </div>
                <div>
                  <label className="settings-label">From Phone Number</label>
                  <input
                    type="tel"
                    className="settings-input"
                    placeholder="+15551234567"
                    {...twilioForm.register('fromNumber', { required: 'Phone number is required', pattern: { value: /^\+\d{8,15}$/, message: 'Use international format e.g. +15551234567' } })}
                  />
                  {twilioForm.formState.errors.fromNumber && <p className="settings-error">{twilioForm.formState.errors.fromNumber.message}</p>}
                </div>
                <div>
                  <label className="settings-label">Verify Service SID</label>
                  <input
                    type="text"
                    className="settings-input"
                    {...twilioForm.register('verifyServiceSid', {
                      required: 'Verify Service SID is required',
                      pattern: { value: /^VA[a-zA-Z0-9]{32}$/, message: 'Invalid Verify Service SID format' },
                    })}
                  />
                  {twilioForm.formState.errors.verifyServiceSid && <p className="settings-error">{twilioForm.formState.errors.verifyServiceSid.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="settings-label">OTP Template</label>
                  <textarea
                    rows={3}
                    className="settings-input"
                    {...twilioForm.register('otpTemplate', {
                      required: 'Template is required',
                      validate: (value) => (value.includes('{{code}}') ? true : 'Template must include {{code}} placeholder'),
                    })}
                  />
                  {twilioForm.formState.errors.otpTemplate && <p className="settings-error">{twilioForm.formState.errors.otpTemplate.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="settings-label flex items-center gap-2">
                    <Phone size={16} /> Test Phone Number
                  </label>
                  <input
                    type="tel"
                    className="settings-input"
                    placeholder="Enter phone number to send test OTP"
                    value={testPhoneNumber}
                    onChange={(event) => setTestPhoneNumber(event.target.value)}
                  />
                </div>
              </form>
            </section>
          )}

          {activeTab === 'integrations' && <ThirdPartySettings />}

          {activeTab === 'general' && (
            <section className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Application Preferences</h2>
                  <p className="settings-card-subtitle">Customize the admin experience for your team.</p>
                </div>
                <button type="button" className="btn-primary" onClick={onSubmitGeneral} disabled={generalMutation.isPending}>
                  {generalMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Save Changes
                </button>
              </div>
              <form className="settings-form-grid" onSubmit={onSubmitGeneral}>
                <div className="md:col-span-2">
                  <label className="settings-label">API Endpoint</label>
                  <input
                    type="url"
                    className="settings-input"
                    {...generalForm.register('apiBaseUrl', { required: 'API endpoint is required', pattern: { value: /^https?:\/\//, message: 'Must be a valid URL' } })}
                  />
                  {generalForm.formState.errors.apiBaseUrl && <p className="settings-error">{generalForm.formState.errors.apiBaseUrl.message}</p>}
                </div>
                <div>
                  <label className="settings-label flex items-center gap-2">
                    <Globe size={16} /> Default Language
                  </label>
                  <select className="settings-input" {...generalForm.register('language', { required: true })}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                <div>
                  <label className="settings-label">Theme</label>
                  <select className="settings-input" {...generalForm.register('theme', { required: true })}>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <span className="settings-label">Notifications</span>
                  <div className="settings-notification-grid">
                    <label className="settings-checkbox">
                      <input type="checkbox" {...generalForm.register('notifications.email')} />
                      <span>Email Alerts</span>
                    </label>
                    <label className="settings-checkbox">
                      <input type="checkbox" {...generalForm.register('notifications.sms')} />
                      <span>SMS Alerts</span>
                    </label>
                    <label className="settings-checkbox">
                      <input type="checkbox" {...generalForm.register('notifications.push')} />
                      <span>Push Notifications</span>
                    </label>
                  </div>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="settings-card space-y-10">
              <div>
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Security Controls</h2>
                    <p className="settings-card-subtitle">Safeguard dashboard access and credentials.</p>
                  </div>
                </div>
                <form className="settings-form-grid" onSubmit={onSubmitPassword}>
                  <div className="md:col-span-2">
                    <h3 className="settings-section-title">Change Password</h3>
                    <p className="text-sm text-gray-400 mb-4">Update the password for your current administrator session.</p>
                  </div>
                  <div>
                    <label className="settings-label">Current Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                    />
                    {passwordForm.formState.errors.currentPassword && <p className="settings-error">{passwordForm.formState.errors.currentPassword.message}</p>}
                  </div>
                  <div>
                    <label className="settings-label">New Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      {...passwordForm.register('newPassword', {
                        required: 'New password is required',
                        minLength: { value: 10, message: 'Password must be at least 10 characters' },
                        validate: (value) => /[A-Z]/.test(value) || 'Must contain an uppercase letter',
                      })}
                    />
                    {passwordForm.formState.errors.newPassword && <p className="settings-error">{passwordForm.formState.errors.newPassword.message}</p>}
                  </div>
                  <div>
                    <label className="settings-label">Confirm Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      {...passwordForm.register('confirmPassword', { required: 'Confirm password is required' })}
                    />
                    {passwordForm.formState.errors.confirmPassword && <p className="settings-error">{passwordForm.formState.errors.confirmPassword.message}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" className="btn-primary" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
                      Update Password
                    </button>
                    {changePasswordMutation.isSuccess && <span className="text-sm text-emerald-400">Password updated successfully.</span>}
                  </div>
                </form>
              </div>

              <div className="border-t border-gray-700 pt-8">
                <div className="settings-card-header">
                  <div>
                    <h3 className="settings-section-title">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-400">Add an extra layer of protection to your admin account.</p>
                  </div>
                  <button type="button" className="btn-secondary" onClick={handleToggleTwoFactor} disabled={twoFactorMutation.isPending}>
                    {twoFactorMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
                <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                  <p className="text-sm text-gray-300 mb-2">
                    Status:{' '}
                    <span className={twoFactorEnabled ? 'text-emerald-400 font-medium' : 'text-gray-400 font-medium'}>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400">
                    When enabled, administrators will be prompted to verify a code from the configured OTP provider during login.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-8">
                <div className="settings-card-header">
                  <div>
                    <h3 className="settings-section-title">API Keys</h3>
                    <p className="text-sm text-gray-400">Issue API credentials for external integrations.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New key name"
                      className="settings-input w-56"
                      value={newApiKeyName}
                      onChange={(event) => setNewApiKeyName(event.target.value)}
                    />
                    <button type="button" className="btn-primary" onClick={handleCreateApiKey} disabled={createKeyMutation.isPending}>
                      {createKeyMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlusIcon />}
                      Generate Key
                    </button>
                  </div>
                </div>
                {generatedKeySecret && (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 mb-4">
                    <p className="text-sm text-emerald-200 flex items-center gap-2">
                      <EyeOff size={16} />
                      This secret is only shown once. Copy and store it securely.
                    </p>
                    <code className="mt-2 block break-all text-emerald-100 text-sm bg-emerald-500/20 rounded-lg p-3">
                      {generatedKeySecret}
                    </code>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Prefix</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Last Used</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {apiKeys.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                            No API keys have been created yet.
                          </td>
                        </tr>
                      )}
                      {apiKeys.map((key) => (
                        <tr key={key.id} className="text-sm text-gray-200">
                          <td className="px-4 py-3">{key.name}</td>
                          <td className="px-4 py-3 font-mono text-xs">{key.prefix}</td>
                          <td className="px-4 py-3">{formatDate(key.createdAt)}</td>
                          <td className="px-4 py-3">{formatDate(key.lastUsedAt)}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="text-red-400 hover:text-red-300 text-sm font-medium"
                              onClick={() => revokeKeyMutation.mutate(key.id)}
                              disabled={revokeKeyMutation.isPending}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
  </svg>
}

