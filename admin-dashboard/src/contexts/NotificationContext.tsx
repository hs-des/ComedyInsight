import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type NotificationVariant = 'success' | 'error' | 'info' | 'warning'

export interface NotificationAction {
  label: string
  onPress: () => void
  variant?: 'default' | 'primary' | 'danger'
}

export interface NotificationItem {
  id: string
  title: string
  description?: string
  variant: NotificationVariant
  duration?: number
  persistent?: boolean
  timestamp: number
  actions?: NotificationAction[]
}

export interface NotificationPreferences {
  autoDismiss: boolean
  autoDismissDuration: number
  position: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-left'
  playSound: boolean
  showCenter: boolean
}

interface NotificationContextValue {
  notifications: NotificationItem[]
  preferences: NotificationPreferences
  notify: (payload: Omit<NotificationItem, 'id' | 'timestamp'>) => void
  dismiss: (id: string) => void
  clearAll: () => void
  updatePreferences: (updater: Partial<NotificationPreferences>) => void
}

const STORAGE_KEY = 'comedyinsight.notifications.preferences'

const defaultPreferences: NotificationPreferences = {
  autoDismiss: true,
  autoDismissDuration: 4500,
  position: 'top-right',
  playSound: false,
  showCenter: true,
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

const createId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2))

const loadPreferences = (): NotificationPreferences => {
  if (typeof window === 'undefined') return defaultPreferences
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultPreferences
    return { ...defaultPreferences, ...(JSON.parse(stored) as NotificationPreferences) }
  } catch (error) {
    console.warn('Failed to load notification preferences', error)
    return defaultPreferences
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => loadPreferences())
  const timeoutHandles = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id))
    const handle = timeoutHandles.current.get(id)
    if (handle) {
      window.clearTimeout(handle)
      timeoutHandles.current.delete(id)
    }
  }, [])

  const scheduleAutoDismiss = useCallback(
    (id: string, duration: number) => {
      const handle = window.setTimeout(() => {
        dismiss(id)
      }, duration)
      timeoutHandles.current.set(id, handle)
    },
    [dismiss]
  )

  const notify = useCallback(
    (payload: Omit<NotificationItem, 'id' | 'timestamp'>) => {
      const id = createId()
      const duration = payload.duration ?? (preferences.autoDismiss ? preferences.autoDismissDuration : 0)
      const notification: NotificationItem = {
        ...payload,
        id,
        duration,
        timestamp: Date.now(),
      }
      setNotifications((prev) => [...prev, notification])
      if (duration > 0 && !payload.persistent) {
        scheduleAutoDismiss(id, duration)
      }
      if (preferences.playSound && typeof window !== 'undefined') {
        const audio = new Audio('/sounds/notification.wav')
        void audio.play().catch(() => {
          /* ignore playback errors */
        })
      }
    },
    [preferences.autoDismiss, preferences.autoDismissDuration, preferences.playSound, scheduleAutoDismiss]
  )

  const clearAll = useCallback(() => {
    timeoutHandles.current.forEach((handle) => window.clearTimeout(handle))
    timeoutHandles.current.clear()
    setNotifications([])
  }, [])

  const updatePreferences = useCallback((updater: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updater }))
  }, [])

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      preferences,
      notify,
      dismiss,
      clearAll,
      updatePreferences,
    }),
    [notifications, preferences, notify, dismiss, clearAll, updatePreferences]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

