import { useCallback, useMemo, useState } from 'react'

import { PageLoader } from '../components/feedback'

interface PageLoadingState {
  isVisible: boolean
  title: string
  message: string
  progress?: number
}

const defaultState: PageLoadingState = {
  isVisible: false,
  title: 'Loading',
  message: 'Preparing your dashboard…',
}

export function usePageLoading() {
  const [state, setState] = useState<PageLoadingState>(defaultState)

  const show = useCallback((partial?: Partial<Omit<PageLoadingState, 'isVisible'>>) => {
    setState((prev) => ({
      ...prev,
      ...partial,
      isVisible: true,
    }))
  }, [])

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: false, progress: undefined }))
  }, [])

  const setProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, progress }))
  }, [])

  const Loader = useMemo(() => {
    if (!state.isVisible) return null
    return <PageLoader title={state.title} message={state.message} progress={state.progress} />
  }, [state.isVisible, state.message, state.progress, state.title])

  return {
    show,
    hide,
    setProgress,
    isVisible: state.isVisible,
    Loader,
  }
}

