import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutoRefreshOptions {
  intervalMs?: number
  enabled?: boolean
  immediate?: boolean
}

interface UseAutoRefreshReturn {
  start: () => void
  stop: () => void
  trigger: () => void
  isActive: boolean
}

export function useAutoRefresh(callback: () => void, options: UseAutoRefreshOptions = {}): UseAutoRefreshReturn {
  const { intervalMs = 30000, enabled = true, immediate = false } = options
  const timerRef = useRef<number | null>(null)
  const [isActive, setIsActive] = useState(enabled)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!enabled || timerRef.current !== null) return
    timerRef.current = window.setInterval(() => {
      callback()
    }, intervalMs)
    setIsActive(true)
  }, [callback, enabled, intervalMs])

  const stop = useCallback(() => {
    clearTimer()
    setIsActive(false)
  }, [clearTimer])

  const trigger = useCallback(() => {
    callback()
  }, [callback])

  useEffect(() => {
    if (!enabled) {
      stop()
      return
    }

    if (immediate) {
      callback()
    }

    start()

    return () => {
      clearTimer()
    }
  }, [callback, clearTimer, enabled, immediate, start, stop])

  return {
    start,
    stop,
    trigger,
    isActive,
  }
}

