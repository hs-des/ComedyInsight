import { useCallback, useEffect, useRef, useState } from 'react'

export type WebSocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

interface UseWebSocketOptions<TMessage> {
  protocols?: string | string[]
  autoReconnect?: boolean
  reconnectIntervalMs?: number
  maxReconnectAttempts?: number
  parseMessage?: (event: MessageEvent) => TMessage
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onMessage?: (message: TMessage, event: MessageEvent) => void
}

interface UseWebSocketReturn<TMessage> {
  status: WebSocketStatus
  isConnected: boolean
  lastMessage: TMessage | null
  error: Event | null
  sendMessage: (payload: string | ArrayBufferLike | Blob | ArrayBufferView) => void
  disconnect: () => void
  reconnect: () => void
}

export function useWebSocket<TMessage = MessageEvent>(
  url: string | null,
  { autoReconnect = true, reconnectIntervalMs = 5000, maxReconnectAttempts = 10, parseMessage, protocols, onOpen, onClose, onError, onMessage }: UseWebSocketOptions<TMessage> = {}
): UseWebSocketReturn<TMessage> {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<number | null>(null)

  const [status, setStatus] = useState<WebSocketStatus>('idle')
  const [lastMessage, setLastMessage] = useState<TMessage | null>(null)
  const [error, setError] = useState<Event | null>(null)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    clearReconnectTimer()
    socketRef.current?.close()
    socketRef.current = null
    setStatus('closed')
  }, [clearReconnectTimer])

  const connect = useCallback(() => {
    if (!url) return

    disconnect()

    setStatus('connecting')
    const ws = new WebSocket(url, protocols)
    socketRef.current = ws

    ws.onopen = (event) => {
      setStatus('open')
      reconnectAttemptsRef.current = 0
      onOpen?.(event)
    }

    ws.onmessage = (event) => {
      const parsedMessage = parseMessage ? parseMessage(event) : ((event as unknown) as TMessage)
      setLastMessage(parsedMessage)
      onMessage?.(parsedMessage, event)
    }

    ws.onerror = (event) => {
      setStatus('error')
      setError(event)
      onError?.(event)
    }

    ws.onclose = (event) => {
      setStatus('closed')
      onClose?.(event)

      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1
        clearReconnectTimer()
        reconnectTimerRef.current = window.setTimeout(() => {
          connect()
        }, reconnectIntervalMs)
      }
    }
  }, [autoReconnect, clearReconnectTimer, disconnect, maxReconnectAttempts, onClose, onError, onMessage, onOpen, parseMessage, protocols, reconnectIntervalMs, url])

  const sendMessage = useCallback(
    (payload: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(payload)
      }
    },
    []
  )

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    clearReconnectTimer()
    connect()
  }, [clearReconnectTimer, connect])

  useEffect(() => {
    connect()

    return () => {
      clearReconnectTimer()
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [clearReconnectTimer, connect])

  return {
    status,
    isConnected: status === 'open',
    lastMessage,
    error,
    sendMessage,
    disconnect,
    reconnect,
  }
}

