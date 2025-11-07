import { useCallback, useEffect, useRef, useState } from 'react'

type AsyncStatus = 'idle' | 'pending' | 'success' | 'error'

interface UseAsyncTaskOptions<TResult> {
  immediate?: boolean
  autoResetMs?: number
  onSuccess?: (result: TResult) => void
  onError?: (error: unknown) => void
}

interface UseAsyncTaskReturn<TResult, TArgs extends unknown[]> {
  status: AsyncStatus
  data: TResult | null
  error: unknown
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  execute: (...args: TArgs) => Promise<TResult | null>
  reset: () => void
  lastUpdated: number | null
}

export function useAsyncTask<TResult, TArgs extends unknown[] = []>(
  task: (...args: TArgs) => Promise<TResult>,
  { immediate = false, autoResetMs, onSuccess, onError }: UseAsyncTaskOptions<TResult> = {}
): UseAsyncTaskReturn<TResult, TArgs> {
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [data, setData] = useState<TResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const mountedRef = useRef(true)
  const timerRef = useRef<number | null>(null)

  const reset = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setStatus('idle')
    setData(null)
    setError(null)
    setLastUpdated(null)
  }, [])

  const execute = useCallback(
    async (...args: TArgs) => {
      setStatus('pending')
      setError(null)

      try {
        const result = await task(...args)
        if (!mountedRef.current) {
          return null
        }
        setStatus('success')
        setData(result)
        setLastUpdated(Date.now())
        onSuccess?.(result)

        if (autoResetMs) {
          if (timerRef.current) {
            window.clearTimeout(timerRef.current)
          }
          timerRef.current = window.setTimeout(() => {
            reset()
          }, autoResetMs)
        }

        return result
      } catch (err) {
        if (!mountedRef.current) {
          return null
        }
        setStatus('error')
        setError(err)
        onError?.(err)
        return null
      }
    },
    [autoResetMs, onError, onSuccess, reset, task]
  )

  useEffect(() => {
    mountedRef.current = true
    if (immediate) {
      void execute(...([] as unknown as TArgs))
    }

    return () => {
      mountedRef.current = false
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [execute, immediate])

  return {
    status,
    data,
    error,
    isIdle: status === 'idle',
    isLoading: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    reset,
    lastUpdated,
  }
}

