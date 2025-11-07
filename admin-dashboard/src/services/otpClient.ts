import axios from 'axios'

export interface SendOtpResponse {
  success: boolean
  message: string
  expires_at: string
  resend_available_in: number
  method: 'sms' | 'voice'
}

export interface VerifyOtpResponse {
  verified: boolean
  message: string
}

export interface VerificationStatus {
  phone_number: string
  verified: boolean
  method: string
  attempts: number
  max_attempts: number
  expires_at?: string | null
  last_sent_at?: string | null
}

export const sendOtp = async (phoneNumber: string, method: 'sms' | 'voice' = 'sms'): Promise<SendOtpResponse> => {
  const { data } = await axios.post<SendOtpResponse>('/api/auth/send-otp', {
    phone_number: phoneNumber,
    method,
  })
  return data
}

export const verifyOtp = async (phoneNumber: string, code: string): Promise<VerifyOtpResponse> => {
  const { data } = await axios.post<VerifyOtpResponse>('/api/auth/verify-otp', {
    phone_number: phoneNumber,
    code,
  })
  return data
}

export const resendOtp = async (phoneNumber: string, method: 'sms' | 'voice' = 'sms'): Promise<SendOtpResponse> => {
  const { data } = await axios.post<SendOtpResponse>('/api/auth/resend-otp', {
    phone_number: phoneNumber,
    method,
  })
  return data
}

export const getVerificationStatus = async (phoneNumber: string): Promise<VerificationStatus> => {
  const { data } = await axios.get<VerificationStatus>('/api/auth/verification-status', {
    params: { phone_number: phoneNumber },
  })
  return data
}

