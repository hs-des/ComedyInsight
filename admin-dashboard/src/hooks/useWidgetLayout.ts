import { useMemo } from 'react'

import { useWidgetLayoutContext } from '../contexts/WidgetLayoutContext'

export const useWidgetLayout = () => {
  const context = useWidgetLayoutContext()

  const orderedVisibleWidgets = useMemo(
    () => context.visibleWidgets.slice().sort((a, b) => a.title.localeCompare(b.title)),
    [context.visibleWidgets]
  )

  return {
    ...context,
    orderedVisibleWidgets,
  }
}

