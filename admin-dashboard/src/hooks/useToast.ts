import { useNotifications } from '../contexts/NotificationContext'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  description?: string
  duration?: number
  actions?: import('../contexts/NotificationContext').NotificationAction[]
  persistent?: boolean
}

export function useToast() {
  const { notify } = useNotifications()

  const show = (variant: ToastVariant, title: string, options: ToastOptions = {}) => {
    notify({
      title,
      description: options.description,
      variant,
      duration: options.duration,
      actions: options.actions,
      persistent: options.persistent,
    })
  }

  return {
    success: (title: string, options?: ToastOptions) => show('success', title, options),
    error: (title: string, options?: ToastOptions) => show('error', title, options),
    info: (title: string, options?: ToastOptions) => show('info', title, options),
    warning: (title: string, options?: ToastOptions) => show('warning', title, options),
    custom: show,
  }
}

