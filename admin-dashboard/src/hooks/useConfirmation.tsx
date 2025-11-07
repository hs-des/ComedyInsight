import { ReactNode, useCallback, useMemo, useState } from 'react'

import { ConfirmationDialog } from '../components/feedback/ConfirmationDialog'

type ConfirmationTone = 'default' | 'warning' | 'danger'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmationTone
  isBulkAction?: boolean
  bulkCount?: number
  customContent?: ReactNode
}

export function useConfirmation() {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null)
  const [loading, setLoading] = useState(false)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve })
      setLoading(false)
    })
  }, [])

  const handleClose = useCallback(() => {
    setState((current) => {
      current?.resolve(false)
      return null
    })
    setLoading(false)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!state) return
    setLoading(true)
    state.resolve(true)
    setState(null)
    setLoading(false)
  }, [state])

  const Dialog = useMemo(() => {
    if (!state) return null
    return (
      <ConfirmationDialog
        open
        title={state.options.title}
        description={state.options.description}
        confirmLabel={state.options.confirmLabel}
        cancelLabel={state.options.cancelLabel}
        tone={state.options.tone}
        isBulkAction={state.options.isBulkAction}
        bulkCount={state.options.bulkCount}
        customContent={state.options.customContent}
        onCancel={handleClose}
        onConfirm={handleConfirm}
        loading={loading}
      />
    )
  }, [handleClose, handleConfirm, loading, state])

  return {
    confirm,
    ConfirmationDialog: Dialog,
  }
}

