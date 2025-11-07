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

