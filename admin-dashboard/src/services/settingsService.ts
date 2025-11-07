import axios from 'axios'

export interface StorageSettings {
  endpoint: string
  accessKey: string
  secretKey: string
  bucket: string
  region: string
}

export interface StorageTestResponse {
  success: boolean
  latencyMs?: number
  message: string
}

export interface TwilioSettings {
  accountSid: string
  authToken: string
  fromNumber: string
  verifyServiceSid: string
  otpTemplate: string
}

export interface TwilioTestPayload {
  phoneNumber: string
  message?: string
}

export interface GeneralSettings {
  apiBaseUrl: string
  theme: 'dark' | 'light' | 'system'
  language: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

export interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt?: string | null
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  apiKeys: ApiKey[]
}

export interface SettingsResponse {
  storage: StorageSettings
  twilio: TwilioSettings
  general: GeneralSettings
  security: SecuritySettings
}

export interface FirebaseSettings {
  projectId: string
  apiKey: string
  appId: string
  messagingSenderId: string
  measurementId?: string
  defaultNotificationTitle: string
  defaultNotificationBody: string
  serviceAccountLinked?: boolean
}

export interface FirebaseTestPayload {
  target: string
  title: string
  body: string
}

export interface FirebaseTestResponse {
  success: boolean
  message: string
  requestId?: string
}

export interface OAuthProviderSettings {
  googleClientId: string
  googleClientSecret: string
  googleRedirectUri: string
  googleStatus: 'active' | 'inactive'
  facebookAppId: string
  facebookAppSecret: string
  facebookRedirectUri: string
  facebookStatus: 'active' | 'inactive'
}

export interface OAuthTestPayload {
  provider: 'google' | 'facebook'
}

export interface OAuthTestResponse {
  provider: 'google' | 'facebook'
  success: boolean
  message: string
}

export interface ApiKeyUsage extends ApiKey {
  permissions: string[]
  usageCount: number
  lastRotatedAt?: string | null
  status: 'active' | 'revoked'
}

export interface IntegrationAuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  details?: string
  createdAt: string
}

export const fetchSettings = async (): Promise<SettingsResponse> => {
  const { data } = await axios.get<SettingsResponse>('/api/admin/settings')
  return data
}

export const updateStorageSettings = async (payload: StorageSettings): Promise<StorageSettings> => {
  const { data } = await axios.put<StorageSettings>('/api/admin/settings/storage', payload)
  return data
}

export const testStorageConnection = async (payload: StorageSettings): Promise<StorageTestResponse> => {
  const { data } = await axios.post<StorageTestResponse>('/api/admin/settings/storage/test', payload)
  return data
}

export const updateTwilioSettings = async (payload: TwilioSettings): Promise<TwilioSettings> => {
  const { data } = await axios.put<TwilioSettings>('/api/admin/settings/twilio', payload)
  return data
}

export const sendTestOtp = async (payload: TwilioTestPayload): Promise<{ success: boolean; message: string }> => {
  const { data } = await axios.post<{ success: boolean; message: string }>('/api/admin/settings/twilio/test', payload)
  return data
}

export const updateGeneralSettings = async (payload: GeneralSettings): Promise<GeneralSettings> => {
  const { data } = await axios.put<GeneralSettings>('/api/admin/settings/general', payload)
  return data
}

export const changePassword = async (payload: {
  currentPassword: string
  newPassword: string
}): Promise<{ success: boolean }> => {
  const { data } = await axios.post<{ success: boolean }>('/api/admin/settings/security/change-password', payload)
  return data
}

export const toggleTwoFactor = async (enabled: boolean): Promise<{ enabled: boolean }> => {
  const { data } = await axios.post<{ enabled: boolean }>('/api/admin/settings/security/two-factor', { enabled })
  return data
}

export const createApiKey = async (payload: { name: string }): Promise<{ apiKey: ApiKey; secret: string }> => {
  const { data } = await axios.post<{ apiKey: ApiKey; secret: string }>('/api/admin/settings/security/api-keys', payload)
  return data
}

export const revokeApiKey = async (id: string): Promise<{ success: boolean }> => {
  const { data } = await axios.delete<{ success: boolean }>(`/api/admin/settings/security/api-keys/${id}`)
  return data
}

export const fetchApiKeys = async (): Promise<ApiKey[]> => {
  const { data } = await axios.get<ApiKey[]>('/api/admin/settings/security/api-keys')
  return data
}

export const fetchFirebaseSettings = async (): Promise<FirebaseSettings> => {
  const { data } = await axios.get<FirebaseSettings>('/api/admin/settings/firebase')
  return data
}

export const updateFirebaseSettings = async (payload: FirebaseSettings): Promise<FirebaseSettings> => {
  const { data } = await axios.put<FirebaseSettings>('/api/admin/settings/firebase', payload)
  return data
}

export const uploadFirebaseServiceAccount = async (file: File): Promise<{ uploaded: boolean; fileName?: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await axios.post<{ uploaded: boolean; fileName?: string }>('/api/admin/settings/firebase/service-account', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const testFirebaseNotification = async (payload: FirebaseTestPayload): Promise<FirebaseTestResponse> => {
  const { data } = await axios.post<FirebaseTestResponse>('/api/admin/settings/firebase/test-notification', payload)
  return data
}

export const fetchOAuthSettings = async (): Promise<OAuthProviderSettings> => {
  const { data } = await axios.get<OAuthProviderSettings>('/api/admin/settings/oauth')
  return data
}

export const updateOAuthSettings = async (payload: OAuthProviderSettings): Promise<OAuthProviderSettings> => {
  const { data } = await axios.put<OAuthProviderSettings>('/api/admin/settings/oauth', payload)
  return data
}

export const testOAuthProvider = async (payload: OAuthTestPayload): Promise<OAuthTestResponse> => {
  const { data } = await axios.post<OAuthTestResponse>('/api/admin/settings/oauth/test', payload)
  return data
}

export const fetchApiKeyUsage = async (): Promise<ApiKeyUsage[]> => {
  const { data } = await axios.get<ApiKeyUsage[]>('/api/admin/settings/security/api-keys/usage')
  return data
}

export const rotateApiKey = async (id: string): Promise<{ apiKey: ApiKeyUsage; secret: string }> => {
  const { data } = await axios.post<{ apiKey: ApiKeyUsage; secret: string }>(`/api/admin/settings/security/api-keys/${id}/rotate`)
  return data
}

export const updateApiKeyPermissions = async (id: string, permissions: string[]): Promise<ApiKeyUsage> => {
  const { data } = await axios.put<ApiKeyUsage>(`/api/admin/settings/security/api-keys/${id}/permissions`, { permissions })
  return data
}

export const fetchIntegrationAuditLog = async (): Promise<IntegrationAuditLogEntry[]> => {
  const { data } = await axios.get<IntegrationAuditLogEntry[]>('/api/admin/settings/integrations/audit-log')
  return data
}

