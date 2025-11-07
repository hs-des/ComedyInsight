import { useEffect, useMemo, useState } from 'react'
import { useForm, UseFormRegister, RegisterOptions } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  Cloud,
  FileText,
  Flame,
  Globe,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  Phone,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from 'lucide-react'

import {
  StorageSettings,
  TwilioSettings,
  fetchSettings,
  updateStorageSettings,
  testStorageConnection,
  updateTwilioSettings,
  sendTestOtp,
  fetchFirebaseSettings,
  updateFirebaseSettings,
  uploadFirebaseServiceAccount,
  testFirebaseNotification,
  fetchOAuthSettings,
  updateOAuthSettings,
  testOAuthProvider,
  fetchApiKeyUsage,
  rotateApiKey,
  updateApiKeyPermissions,
  fetchIntegrationAuditLog,
  FirebaseSettings as FirebaseSettingsType,
  FirebaseTestPayload,
  OAuthProviderSettings,
  OAuthTestPayload,
  ApiKeyUsage,
  IntegrationAuditLogEntry,
} from '../../services/settingsService'
import { getStorageUsage } from '../../services/fileService'

interface StatusState {
  state: 'idle' | 'saving' | 'testing' | 'success' | 'error'
  message?: string
}

interface FirebaseFormValues extends FirebaseSettingsType {}

interface OAuthFormValues extends OAuthProviderSettings {}

const PERMISSION_OPTIONS = [
  { value: 'videos', label: 'Videos' },
  { value: 'users', label: 'Users' },
  { value: 'billing', label: 'Billing' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'content:write', label: 'Content Write' },
  { value: 'settings:manage', label: 'Settings Manage' },
]

type IntegrationTab = 'aws' | 'twilio' | 'firebase' | 'oauth' | 'apiKeys'

function StatusBanner({ status }: { status: StatusState }) {
  if (status.state === 'idle') return null
  const Icon = status.state === 'success' ? CheckCircle2 : status.state === 'testing' ? Loader2 : status.state === 'saving' ? Loader2 : XCircle
  const color =
    status.state === 'success'
      ? 'text-emerald-400'
      : status.state === 'testing' || status.state === 'saving'
      ? 'text-blue-400 animate-spin'
      : 'text-red-400'
  return (
    <div className="settings-status mt-3">
      <Icon size={18} className={color} />
      <span>{status.message}</span>
    </div>
  )
}

function MaskedInput({
  label,
  type = 'text',
  placeholder,
  register,
  name,
  error,
  validation,
}: {
  label: string
  type?: string
  placeholder?: string
  register: UseFormRegister<any>
  name: string
  error?: string
  validation?: RegisterOptions
}) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div>
      <label className="settings-label flex items-center justify-between">
        <span>{label}</span>
        <button
          type="button"
          className="text-xs text-primary hover:text-primary/80"
          onClick={() => setRevealed((prev) => !prev)}
        >
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </label>
      <input
        type={revealed ? 'text' : type}
        className="settings-input"
        placeholder={placeholder}
        {...register(name, validation)}
        autoComplete="off"
      />
      {error && <p className="settings-error">{error}</p>}
    </div>
  )
}

export default function ThirdPartySettings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<IntegrationTab>('aws')
  const [awsStatus, setAwsStatus] = useState<StatusState>({ state: 'idle' })
  const [twilioStatus, setTwilioStatus] = useState<StatusState>({ state: 'idle' })
  const [firebaseStatus, setFirebaseStatus] = useState<StatusState>({ state: 'idle' })
  const [oauthStatus, setOauthStatus] = useState<StatusState>({ state: 'idle' })
  const [apiKeySecret, setApiKeySecret] = useState<string | null>(null)
  const [serviceAccountName, setServiceAccountName] = useState<string | null>(null)
  const [testTarget, setTestTarget] = useState('')
  const [testTitle, setTestTitle] = useState('Test Notification')
  const [testBody, setTestBody] = useState('This is a test push from ComedyInsight Admin')

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const storageUsageQuery = useQuery({
    queryKey: ['settings', 'storage', 'usage'],
    queryFn: getStorageUsage,
  })

  const firebaseQuery = useQuery({
    queryKey: ['settings', 'firebase'],
    queryFn: fetchFirebaseSettings,
  })

  const oauthQuery = useQuery({
    queryKey: ['settings', 'oauth'],
    queryFn: fetchOAuthSettings,
  })

  const apiKeyUsageQuery = useQuery({
    queryKey: ['settings', 'api-keys', 'usage'],
    queryFn: fetchApiKeyUsage,
  })

  const auditLogQuery = useQuery({
    queryKey: ['settings', 'integrations', 'audit-log'],
    queryFn: fetchIntegrationAuditLog,
  })

  const awsForm = useForm<StorageSettings>({
    defaultValues: { endpoint: '', accessKey: '', secretKey: '', bucket: '', region: '' },
  })

  const twilioForm = useForm<TwilioSettings>({
    defaultValues: {
      accountSid: '',
      authToken: '',
      fromNumber: '',
      verifyServiceSid: '',
      otpTemplate: 'Your ComedyInsight verification code is {{code}}',
    },
  })

  const firebaseForm = useForm<FirebaseFormValues>({
    defaultValues: {
      projectId: '',
      apiKey: '',
      appId: '',
      messagingSenderId: '',
      measurementId: '',
      defaultNotificationTitle: 'ComedyInsight Update',
      defaultNotificationBody: 'Thanks for staying tuned!',
    },
  })

  const oauthForm = useForm<OAuthFormValues>({
    defaultValues: {
      googleClientId: '',
      googleClientSecret: '',
      googleRedirectUri: '',
      googleStatus: 'inactive',
      facebookAppId: '',
      facebookAppSecret: '',
      facebookRedirectUri: '',
      facebookStatus: 'inactive',
    },
  })

  const [apiKeys, setApiKeys] = useState<ApiKeyUsage[]>([])

  useEffect(() => {
    if (settingsQuery.data) {
      awsForm.reset(settingsQuery.data.storage)
      twilioForm.reset(settingsQuery.data.twilio)
    }
  }, [settingsQuery.data, awsForm, twilioForm])

  useEffect(() => {
    if (firebaseQuery.data) {
      firebaseForm.reset({ ...firebaseQuery.data })
      if (firebaseQuery.data.serviceAccountLinked) {
        setServiceAccountName('Service account linked')
      }
    }
  }, [firebaseQuery.data, firebaseForm])

  useEffect(() => {
    if (oauthQuery.data) {
      oauthForm.reset(oauthQuery.data)
    }
  }, [oauthQuery.data, oauthForm])

  useEffect(() => {
    if (apiKeyUsageQuery.data) {
      setApiKeys(apiKeyUsageQuery.data)
    }
  }, [apiKeyUsageQuery.data])

  const awsSaveMutation = useMutation({
    mutationFn: updateStorageSettings,
    onMutate: () => setAwsStatus({ state: 'saving', message: 'Saving S3 settings…' }),
    onSuccess: (response) => {
      setAwsStatus({ state: 'success', message: 'AWS S3 configuration saved.' })
      awsForm.reset(response)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => {
      setAwsStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to save AWS settings.' })
    },
  })

  const awsTestMutation = useMutation({
    mutationFn: testStorageConnection,
    onMutate: () => setAwsStatus({ state: 'testing', message: 'Testing connection…' }),
    onSuccess: (response) => {
      setAwsStatus({
        state: response.success ? 'success' : 'error',
        message: response.message || (response.success ? 'Connection successful.' : 'Connection failed.'),
      })
    },
    onError: (error: any) => {
      setAwsStatus({ state: 'error', message: error?.response?.data?.message || 'Connection test failed.' })
    },
  })

  const twilioSaveMutation = useMutation({
    mutationFn: updateTwilioSettings,
    onMutate: () => setTwilioStatus({ state: 'saving', message: 'Saving Twilio configuration…' }),
    onSuccess: (response) => {
      setTwilioStatus({ state: 'success', message: 'Twilio OTP configuration saved.' })
      twilioForm.reset(response)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => {
      setTwilioStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to save Twilio settings.' })
    },
  })

  const twilioTestMutation = useMutation({
    mutationFn: sendTestOtp,
    onMutate: () => setTwilioStatus({ state: 'testing', message: 'Sending test OTP…' }),
    onSuccess: (response) => {
      setTwilioStatus({ state: response.success ? 'success' : 'error', message: response.message })
    },
    onError: (error: any) => {
      setTwilioStatus({ state: 'error', message: error?.response?.data?.message || 'Unable to send test OTP.' })
    },
  })

  const firebaseSaveMutation = useMutation({
    mutationFn: updateFirebaseSettings,
    onMutate: () => setFirebaseStatus({ state: 'saving', message: 'Saving Firebase configuration…' }),
    onSuccess: (response) => {
      setFirebaseStatus({ state: 'success', message: 'Firebase configuration saved.' })
      firebaseForm.reset(response)
      queryClient.invalidateQueries({ queryKey: ['settings', 'firebase'] })
    },
    onError: (error: any) => {
      setFirebaseStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to save Firebase settings.' })
    },
  })

  const serviceAccountMutation = useMutation({
    mutationFn: uploadFirebaseServiceAccount,
    onMutate: () => setFirebaseStatus({ state: 'saving', message: 'Uploading service account…' }),
    onSuccess: (response) => {
      setFirebaseStatus({ state: 'success', message: 'Service account uploaded securely.' })
      setServiceAccountName(response.fileName || 'Service account linked')
      queryClient.invalidateQueries({ queryKey: ['settings', 'firebase'] })
    },
    onError: (error: any) => {
      setFirebaseStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to upload service account.' })
    },
  })

  const firebaseTestMutation = useMutation({
    mutationFn: (payload: FirebaseTestPayload) => testFirebaseNotification(payload),
    onMutate: () => setFirebaseStatus({ state: 'testing', message: 'Sending test notification…' }),
    onSuccess: (response) => {
      setFirebaseStatus({ state: response.success ? 'success' : 'error', message: response.message })
    },
    onError: (error: any) => {
      setFirebaseStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to send test notification.' })
    },
  })

  const oauthSaveMutation = useMutation({
    mutationFn: updateOAuthSettings,
    onMutate: () => setOauthStatus({ state: 'saving', message: 'Saving OAuth credentials…' }),
    onSuccess: (response) => {
      setOauthStatus({ state: 'success', message: 'OAuth provider settings saved.' })
      oauthForm.reset(response)
      queryClient.invalidateQueries({ queryKey: ['settings', 'oauth'] })
    },
    onError: (error: any) => {
      setOauthStatus({ state: 'error', message: error?.response?.data?.message || 'Failed to save OAuth settings.' })
    },
  })

  const oauthTestMutation = useMutation({
    mutationFn: (payload: OAuthTestPayload) => testOAuthProvider(payload),
    onMutate: (_, variables) =>
      setOauthStatus({ state: 'testing', message: `Testing ${variables.provider === 'google' ? 'Google' : 'Facebook'} OAuth handshake…` }),
    onSuccess: (response) => {
      setOauthStatus({ state: response.success ? 'success' : 'error', message: response.message })
      queryClient.invalidateQueries({ queryKey: ['settings', 'oauth'] })
    },
    onError: (error: any) => {
      setOauthStatus({ state: 'error', message: error?.response?.data?.message || 'OAuth test failed.' })
    },
  })

  const rotateKeyMutation = useMutation({
    mutationFn: (id: string) => rotateApiKey(id),
    onSuccess: (response) => {
      setApiKeySecret(response.secret)
      setApiKeys((prev) => prev.map((entry) => (entry.id === response.apiKey.id ? response.apiKey : entry)))
      queryClient.invalidateQueries({ queryKey: ['settings', 'api-keys', 'usage'] })
    },
  })

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) => updateApiKeyPermissions(id, permissions),
    onSuccess: (response) => {
      setApiKeys((prev) => prev.map((entry) => (entry.id === response.id ? response : entry)))
      queryClient.invalidateQueries({ queryKey: ['settings', 'api-keys', 'usage'] })
    },
  })

  const tabItems = useMemo(
    () => [
      { id: 'aws' as IntegrationTab, label: 'AWS S3', description: 'Object storage & CDN', icon: Cloud },
      { id: 'twilio' as IntegrationTab, label: 'Twilio OTP', description: 'SMS verification service', icon: Phone },
      { id: 'firebase' as IntegrationTab, label: 'Firebase', description: 'Push notifications & analytics', icon: Flame },
      { id: 'oauth' as IntegrationTab, label: 'OAuth Providers', description: 'Google & Facebook login', icon: Globe },
      { id: 'apiKeys' as IntegrationTab, label: 'API Keys', description: 'Key rotation & permissioning', icon: KeyRound },
    ],
    []
  )

  const handleAwsSave = awsForm.handleSubmit((values) => awsSaveMutation.mutate(values))
  const handleAwsTest = () => awsTestMutation.mutate(awsForm.getValues())

  const [otpTestNumber, setOtpTestNumber] = useState('')
  const handleTwilioSave = twilioForm.handleSubmit((values) => twilioSaveMutation.mutate(values))
  const handleTwilioTest = () => {
    if (!otpTestNumber) {
      setTwilioStatus({ state: 'error', message: 'Enter a phone number to send test OTP.' })
      return
    }
    twilioTestMutation.mutate({ phoneNumber: otpTestNumber, message: twilioForm.getValues('otpTemplate') })
  }

  const handleFirebaseSave = firebaseForm.handleSubmit((values) => firebaseSaveMutation.mutate(values))
  const handleFirebaseTest = () => {
    if (!testTarget) {
      setFirebaseStatus({ state: 'error', message: 'Provide a device token or topic for the test notification.' })
      return
    }
    firebaseTestMutation.mutate({ target: testTarget, title: testTitle, body: testBody })
  }

  const handleServiceAccountUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setServiceAccountName(file.name)
    serviceAccountMutation.mutate(file)
  }

  const handleOAuthSave = oauthForm.handleSubmit((values) => oauthSaveMutation.mutate(values))

  const handleOAuthTest = (provider: 'google' | 'facebook') => {
    oauthTestMutation.mutate({ provider })
  }

  const handlePermissionChange = (id: string, permissions: string[]) => {
    setApiKeys((prev) => prev.map((entry) => (entry.id === id ? { ...entry, permissions } : entry)))
    updatePermissionsMutation.mutate({ id, permissions })
  }

  const renderAuditRow = (entry: IntegrationAuditLogEntry) => (
    <tr key={entry.id} className="text-sm text-gray-200">
      <td className="px-4 py-3 font-medium">{entry.action}</td>
      <td className="px-4 py-3">{entry.target}</td>
      <td className="px-4 py-3">{entry.actor}</td>
      <td className="px-4 py-3 text-gray-400">{entry.details || '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
      </td>
    </tr>
  )

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-white">Third-Party API Integrations</h2>
        <p className="text-sm text-gray-400">Centralize credentials, connection health, and audit trails for critical service providers.</p>
      </header>

      <div className="settings-tabs">
        {tabItems.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab ${isActive ? 'settings-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
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

      {activeTab === 'aws' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h3 className="settings-card-title flex items-center gap-2">
                <Cloud size={18} /> AWS S3 / MinIO Configuration
              </h3>
              <p className="settings-card-subtitle">Secure object storage credentials are encrypted at rest and used for all media uploads.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={handleAwsTest} disabled={awsTestMutation.isPending}>
                {awsTestMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Test Connection
              </button>
              <button type="button" className="btn-primary" onClick={handleAwsSave} disabled={awsSaveMutation.isPending}>
                {awsSaveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Save Changes
              </button>
            </div>
          </div>
          <StatusBanner status={awsStatus} />
          <form className="settings-form-grid" onSubmit={handleAwsSave}>
            <div>
              <label className="settings-label">Endpoint URL</label>
              <input
                type="url"
                className="settings-input"
                placeholder="https://s3.amazonaws.com"
                {...awsForm.register('endpoint', { required: 'Endpoint is required' })}
              />
              {awsForm.formState.errors.endpoint && <p className="settings-error">{awsForm.formState.errors.endpoint.message}</p>}
            </div>
            <div>
              <label className="settings-label">Bucket Name</label>
              <input
                type="text"
                className="settings-input"
                placeholder="comedyinsight"
                {...awsForm.register('bucket', { required: 'Bucket name is required' })}
              />
              {awsForm.formState.errors.bucket && <p className="settings-error">{awsForm.formState.errors.bucket.message}</p>}
            </div>
            <div>
              <label className="settings-label">Region</label>
              <input type="text" className="settings-input" placeholder="us-east-1" {...awsForm.register('region')} />
            </div>
            <MaskedInput
              label="Access Key"
              name="accessKey"
              placeholder="AKIA..."
              register={awsForm.register}
              validation={{ required: 'Access key is required' }}
              error={awsForm.formState.errors.accessKey?.message}
            />
            <MaskedInput
              label="Secret Key"
              name="secretKey"
              type="password"
              placeholder="••••••••"
              register={awsForm.register}
              validation={{ required: 'Secret key is required', minLength: { value: 8, message: 'Secret must be at least 8 characters' } }}
              error={awsForm.formState.errors.secretKey?.message}
            />
          </form>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
              <h4 className="text-sm font-semibold text-gray-200">Storage Usage</h4>
              {storageUsageQuery.isLoading ? (
                <p className="text-xs text-gray-400 mt-2">Calculating usage…</p>
              ) : storageUsageQuery.data ? (
                <div className="mt-2 text-sm text-gray-300 space-y-1">
                  <p>Total Files: {storageUsageQuery.data.total_files.toLocaleString()}</p>
                  <p>Total Size: {formatBytes(storageUsageQuery.data.total_size)}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Unable to load usage metrics.</p>
              )}
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
              <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Lock size={14} /> Encryption Policy
              </h4>
              <p className="mt-2 text-xs text-gray-400">
                Access and secret keys are stored using AES-256 encryption. Rotate keys regularly and store originals in a secure vault.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'twilio' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h3 className="settings-card-title flex items-center gap-2">
                <Phone size={18} /> Twilio OTP Configuration
              </h3>
              <p className="settings-card-subtitle">Manage SMS delivery credentials, templates, and verification workflow.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={handleTwilioTest} disabled={twilioTestMutation.isPending}>
                {twilioTestMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Send Test OTP
              </button>
              <button type="button" className="btn-primary" onClick={handleTwilioSave} disabled={twilioSaveMutation.isPending}>
                {twilioSaveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Save Changes
              </button>
            </div>
          </div>
          <StatusBanner status={twilioStatus} />
          <form className="settings-form-grid" onSubmit={handleTwilioSave}>
            <div>
              <label className="settings-label">Account SID</label>
              <input
                type="text"
                className="settings-input"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                {...twilioForm.register('accountSid', {
                  required: 'Account SID is required',
                  pattern: { value: /^AC[a-zA-Z0-9]{32}$/, message: 'Invalid SID format' },
                })}
              />
              {twilioForm.formState.errors.accountSid && <p className="settings-error">{twilioForm.formState.errors.accountSid.message}</p>}
            </div>
            <MaskedInput
              label="Auth Token"
              name="authToken"
              type="password"
              placeholder="••••••••"
              register={twilioForm.register}
              validation={{ required: 'Auth token is required', minLength: { value: 16, message: 'Auth token must be at least 16 characters' } }}
              error={twilioForm.formState.errors.authToken?.message}
            />
            <div>
              <label className="settings-label">From Number</label>
              <input
                type="tel"
                className="settings-input"
                placeholder="+15551234567"
                {...twilioForm.register('fromNumber', {
                  required: 'From number is required',
                  pattern: { value: /^\+\d{8,15}$/, message: 'Use E.164 format' },
                })}
              />
              {twilioForm.formState.errors.fromNumber && <p className="settings-error">{twilioForm.formState.errors.fromNumber.message}</p>}
            </div>
            <div>
              <label className="settings-label">Verify Service SID</label>
              <input
                type="text"
                className="settings-input"
                placeholder="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                {...twilioForm.register('verifyServiceSid', {
                  required: 'Verify Service SID is required',
                  pattern: { value: /^VA[a-zA-Z0-9]{32}$/, message: 'Invalid Verify SID' },
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
                  validate: (value) => (value.includes('{{code}}') ? true : 'Template must include {{code}}'),
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
                placeholder="Number to receive test code"
                value={otpTestNumber}
                onChange={(event) => setOtpTestNumber(event.target.value)}
              />
            </div>
          </form>
        </div>
      )}

      {activeTab === 'firebase' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h3 className="settings-card-title flex items-center gap-2">
                <Flame size={18} /> Firebase Cloud Messaging
              </h3>
              <p className="settings-card-subtitle">Configure push notifications, analytics collection, and service account credentials.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={handleFirebaseTest} disabled={firebaseTestMutation.isPending}>
                {firebaseTestMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Send Test Notification
              </button>
              <button type="button" className="btn-primary" onClick={handleFirebaseSave} disabled={firebaseSaveMutation.isPending}>
                {firebaseSaveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Save Changes
              </button>
            </div>
          </div>
          <StatusBanner status={firebaseStatus} />
          <form className="settings-form-grid" onSubmit={handleFirebaseSave}>
            <div>
              <label className="settings-label">Project ID</label>
              <input
                type="text"
                className="settings-input"
                {...firebaseForm.register('projectId', { required: 'Project ID is required' })}
              />
              {firebaseForm.formState.errors.projectId && <p className="settings-error">{firebaseForm.formState.errors.projectId.message}</p>}
            </div>
            <MaskedInput
              label="Web API Key"
              name="apiKey"
              register={firebaseForm.register}
              placeholder="AIza..."
              validation={{ required: 'API key is required' }}
              error={firebaseForm.formState.errors.apiKey?.message}
            />
            <div>
              <label className="settings-label">App ID</label>
              <input
                type="text"
                className="settings-input"
                {...firebaseForm.register('appId', { required: 'App ID is required' })}
              />
              {firebaseForm.formState.errors.appId && <p className="settings-error">{firebaseForm.formState.errors.appId.message}</p>}
            </div>
            <div>
              <label className="settings-label">Messaging Sender ID</label>
              <input
                type="text"
                className="settings-input"
                {...firebaseForm.register('messagingSenderId', { required: 'Sender ID is required' })}
              />
              {firebaseForm.formState.errors.messagingSenderId && <p className="settings-error">{firebaseForm.formState.errors.messagingSenderId.message}</p>}
            </div>
            <div>
              <label className="settings-label">Measurement ID</label>
              <input type="text" className="settings-input" {...firebaseForm.register('measurementId')} />
            </div>
            <div className="md:col-span-2">
              <label className="settings-label flex items-center gap-2">
                <UploadCloud size={16} /> Service Account Key (.json)
              </label>
              <input type="file" accept="application/json" className="settings-input" onChange={handleServiceAccountUpload} />
              <p className="text-xs text-gray-400 mt-1">{serviceAccountName || 'No file uploaded yet.'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="settings-label">Default Notification Title</label>
              <input type="text" className="settings-input" {...firebaseForm.register('defaultNotificationTitle', { required: true })} />
            </div>
            <div className="md:col-span-2">
              <label className="settings-label">Default Notification Body</label>
              <textarea rows={3} className="settings-input" {...firebaseForm.register('defaultNotificationBody', { required: true })} />
            </div>
          </form>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
              <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <FileText size={14} /> Test Payload
              </h4>
              <label className="settings-label mt-3">Device Token or Topic</label>
              <input
                type="text"
                className="settings-input"
                placeholder="/topics/comedyinsight"
                value={testTarget}
                onChange={(event) => setTestTarget(event.target.value)}
              />
              <label className="settings-label mt-3">Title</label>
              <input type="text" className="settings-input" value={testTitle} onChange={(event) => setTestTitle(event.target.value)} />
              <label className="settings-label mt-3">Body</label>
              <textarea rows={2} className="settings-input" value={testBody} onChange={(event) => setTestBody(event.target.value)} />
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
              <h4 className="text-sm font-semibold text-gray-200">Implementation Notes</h4>
              <ul className="mt-2 space-y-2 text-xs text-gray-400">
                <li>Service account keys are stored encrypted, with audit records logged for every upload.</li>
                <li>Use topics for broadcast notifications and device tokens for targeted messaging.</li>
                <li>Templates support Liquid-like placeholders (e.g. {{user_name}}) rendered server-side.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'oauth' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h3 className="settings-card-title flex items-center gap-2">
                <Globe size={18} /> OAuth Provider Credentials
              </h3>
              <p className="settings-card-subtitle">Manage social login integrations for Google and Facebook.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => handleOAuthTest('google')} disabled={oauthTestMutation.isPending}>
                {oauthTestMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Test Google
              </button>
              <button type="button" className="btn-secondary" onClick={() => handleOAuthTest('facebook')} disabled={oauthTestMutation.isPending}>
                {oauthTestMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Test Facebook
              </button>
              <button type="button" className="btn-primary" onClick={handleOAuthSave} disabled={oauthSaveMutation.isPending}>
                {oauthSaveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Save Changes
              </button>
            </div>
          </div>
          <StatusBanner status={oauthStatus} />
          <form className="settings-form-grid" onSubmit={handleOAuthSave}>
            <div>
              <label className="settings-label">Google Client ID</label>
              <input type="text" className="settings-input" {...oauthForm.register('googleClientId', { required: true })} />
            </div>
            <MaskedInput
              label="Google Client Secret"
              name="googleClientSecret"
              register={oauthForm.register}
              type="password"
              validation={{ required: 'Client secret is required' }}
              error={oauthForm.formState.errors.googleClientSecret?.message}
            />
            <div>
              <label className="settings-label flex items-center gap-2">
                <Link2 size={14} /> Google Callback URL
              </label>
              <input type="url" className="settings-input" {...oauthForm.register('googleRedirectUri', { required: true })} />
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-xs text-gray-400">
                Status:{' '}
                <span className={oauthForm.watch('googleStatus') === 'active' ? 'text-emerald-400 font-medium' : 'text-gray-400 font-medium'}>
                  {oauthForm.watch('googleStatus') === 'active' ? 'Active' : 'Inactive'}
                </span>
              </p>
              <select className="settings-input mt-3" {...oauthForm.register('googleStatus')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2 border-t border-gray-800 pt-4" />
            <div>
              <label className="settings-label">Facebook App ID</label>
              <input type="text" className="settings-input" {...oauthForm.register('facebookAppId', { required: true })} />
            </div>
            <MaskedInput
              label="Facebook App Secret"
              name="facebookAppSecret"
              register={oauthForm.register}
              type="password"
              validation={{ required: 'App secret is required' }}
              error={oauthForm.formState.errors.facebookAppSecret?.message}
            />
            <div>
              <label className="settings-label flex items-center gap-2">
                <Link2 size={14} /> Facebook Callback URL
              </label>
              <input type="url" className="settings-input" {...oauthForm.register('facebookRedirectUri', { required: true })} />
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-xs text-gray-400">
                Status:{' '}
                <span className={oauthForm.watch('facebookStatus') === 'active' ? 'text-emerald-400 font-medium' : 'text-gray-400 font-medium'}>
                  {oauthForm.watch('facebookStatus') === 'active' ? 'Active' : 'Inactive'}
                </span>
              </p>
              <select className="settings-input mt-3" {...oauthForm.register('facebookStatus')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'apiKeys' && (
        <div className="settings-card space-y-8">
          <div className="settings-card-header">
            <div>
              <h3 className="settings-card-title flex items-center gap-2">
                <KeyRound size={18} /> API Key Management & Usage
              </h3>
              <p className="settings-card-subtitle">Rotate keys, adjust permissions, and review usage metrics for all integrations.</p>
            </div>
          </div>
          {apiKeySecret && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-200 flex items-center gap-2">
                <ShieldCheck size={16} /> Store this rotated secret securely. It will not be shown again.
              </p>
              <code className="mt-2 block break-all text-sm text-emerald-100 bg-emerald-500/20 rounded-lg p-3">{apiKeySecret}</code>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Prefix</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Last Rotated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {apiKeys.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-sm">
                      No API keys registered yet.
                    </td>
                  </tr>
                )}
                {apiKeys.map((key) => (
                  <tr key={key.id} className="text-sm text-gray-200">
                    <td className="px-4 py-3">
                      <div className="font-medium">{key.name}</div>
                      <div className="text-xs text-gray-500">Status: {key.status === 'active' ? 'Active' : 'Revoked'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{key.prefix}</td>
                    <td className="px-4 py-3">
                      <select
                        multiple
                        className="settings-input h-20"
                        value={key.permissions}
                        onChange={(event) => {
                          const options = Array.from(event.target.selectedOptions).map((option) => option.value)
                          handlePermissionChange(key.id, options)
                        }}
                      >
                        {PERMISSION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">{key.usageCount.toLocaleString()} calls</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {key.lastRotatedAt ? formatDistanceToNow(new Date(key.lastRotatedAt), { addSuffix: true }) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => rotateKeyMutation.mutate(key.id)}
                        disabled={rotateKeyMutation.isPending}
                      >
                        {rotateKeyMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                        Rotate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <FileText size={14} /> Integration Audit Log
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Target</th>
                    <th className="px-3 py-2">Actor</th>
                    <th className="px-3 py-2">Details</th>
                    <th className="px-3 py-2">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {auditLogQuery.isLoading && (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-500" colSpan={5}>
                        Loading audit entries…
                      </td>
                    </tr>
                  )}
                  {!auditLogQuery.isLoading && auditLogQuery.data && auditLogQuery.data.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-500" colSpan={5}>
                        No integration changes recorded yet.
                      </td>
                    </tr>
                  )}
                  {auditLogQuery.data?.map(renderAuditRow)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${value.toFixed(1)} ${units[exponent]}`
}
