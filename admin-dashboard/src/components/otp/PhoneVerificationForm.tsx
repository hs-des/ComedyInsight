import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sendOtp, resendOtp, verifyOtp, getVerificationStatus, SendOtpResponse } from '../../services/otpClient'
import OtpInput from './OtpInput'
import { Loader2, Phone, ShieldCheck, RotateCw } from 'lucide-react'

interface PhoneVerificationFormProps {
  phoneNumber?: string
  defaultCountry?: string
  onVerified?: (phoneNumber: string) => void
}

const COUNTRY_CODES = [
  { code: '+1', label: 'United States / Canada' },
  { code: '+44', label: 'United Kingdom' },
  { code: '+61', label: 'Australia' },
  { code: '+971', label: 'United Arab Emirates' },
  { code: '+91', label: 'India' },
  { code: '+966', label: 'Saudi Arabia' },
]

export default function PhoneVerificationForm({ phoneNumber, defaultCountry = '+1', onVerified }: PhoneVerificationFormProps) {
  const [country, setCountry] = useState(defaultCountry)
  const [localNumber, setLocalNumber] = useState(phoneNumber ? phoneNumber.replace(/^\+\d+/, '') : '')
  const [activeStep, setActiveStep] = useState<'phone' | 'otp' | 'verified'>('phone')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState<number>(0)
  const fullPhone = useMemo(() => `${country}${localNumber}`, [country, localNumber])
  const codeLength = 6

  const sendMutation = useMutation({
    mutationFn: (method: 'sms' | 'voice') => sendOtp(fullPhone, method),
    onSuccess: handleSendSuccess,
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.detail || 'Unable to send OTP. Please try again.')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (code: string) => verifyOtp(fullPhone, code),
    onSuccess: (response) => {
      if (response.verified) {
        setActiveStep('verified')
        setStatusMessage('Phone number verified successfully.')
        onVerified?.(fullPhone)
      } else {
        setErrorMessage(response.message || 'Verification failed. Try again.')
      }
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.detail || 'Invalid or expired OTP code.')
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => resendOtp(fullPhone),
    onSuccess: handleSendSuccess,
    onError: (error: any) => setErrorMessage(error?.response?.data?.detail || 'Unable to resend OTP yet.'),
  })

  useEffect(() => {
    let timer: number | undefined
    if (resendCountdown > 0) {
      timer = window.setTimeout(() => setResendCountdown((prev) => Math.max(prev - 1, 0)), 1000)
    }
    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [resendCountdown])

  useEffect(() => {
    if (!phoneNumber) return
    getVerificationStatus(phoneNumber)
      .then((status) => {
        if (status.verified) {
          setActiveStep('verified')
          setStatusMessage('Phone number already verified.')
        }
      })
      .catch(() => undefined)
  }, [phoneNumber])

  function handleSendSuccess(response: SendOtpResponse) {
    setActiveStep('otp')
    setStatusMessage(response.message)
    setErrorMessage(null)
    setResendCountdown(response.resend_available_in)
  }

  const handleSend = (method: 'sms' | 'voice') => {
    if (!/^\d{6,15}$/.test(localNumber)) {
      setErrorMessage('Enter a valid phone number without the country code.')
      return
    }
    sendMutation.mutate(method)
  }

  return (
    <div className="settings-card max-w-xl mx-auto space-y-6">
      <header className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-3">
          <Phone className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="settings-card-title">Phone Verification</h2>
          <p className="settings-card-subtitle">Secure your account with one-time passcodes sent to your phone.</p>
        </div>
      </header>

      {statusMessage && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/40 px-4 py-3 text-sm text-emerald-200">{statusMessage}</div>}
      {errorMessage && <div className="rounded-lg bg-red-500/10 border border-red-500/40 px-4 py-3 text-sm text-red-200">{errorMessage}</div>}

      {activeStep === 'phone' && (
        <div className="space-y-4">
          <label className="settings-label">Phone number</label>
          <div className="flex gap-3">
            <select value={country} onChange={(event) => setCountry(event.target.value)} className="settings-input w-28">
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              className="settings-input flex-1"
              placeholder="5551234567"
              value={localNumber}
              onChange={(event) => setLocalNumber(event.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="button" onClick={() => handleSend('sms')} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
              Send SMS OTP
            </button>
            <button className="btn-secondary" type="button" onClick={() => handleSend('voice')} disabled={sendMutation.isPending}>
              Call with OTP
            </button>
          </div>
        </div>
      )}

      {activeStep === 'otp' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">Enter the {codeLength}-digit code sent to {fullPhone}.</p>
          <OtpInput length={codeLength} autoSubmit onComplete={(code) => verifyMutation.mutate(code)} disabled={verifyMutation.isPending} />
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{resendCountdown > 0 ? `Resend available in ${resendCountdown}s` : 'Didn’t get the code?'}</span>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 disabled:text-gray-600"
              onClick={() => resendMutation.mutate()}
              disabled={resendCountdown > 0 || resendMutation.isPending}
            >
              <RotateCw size={14} />
              Resend OTP
            </button>
          </div>
        </div>
      )}

      {activeStep === 'verified' && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-6 flex items-center gap-3">
          <ShieldCheck size={20} className="text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-200">Phone number verified.</p>
            <p className="text-xs text-emerald-100/80">OTP login is now enabled for {fullPhone}.</p>
          </div>
        </div>
      )}
    </div>
  )
}

