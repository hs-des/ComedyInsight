import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Layout, Layouts } from 'react-grid-layout'

const WIDGET_LAYOUT_STORAGE_KEY = 'comedyinsight.dashboard.widget.layouts'
const isBrowser = typeof window !== 'undefined'

export interface WidgetDefinition {
  id: string
  title: string
  description?: string
  render: ReactNode | (() => ReactNode)
  defaultLayouts: Layouts
  settings?: Record<string, unknown>
  minH?: number
  minW?: number
}

export interface WidgetState {
  id: string
  layouts: Layouts
  visible: boolean
  settings: Record<string, unknown>
}

export type WidgetInstance = WidgetDefinition & WidgetState

interface WidgetLayoutContextValue {
  widgets: WidgetInstance[]
  visibleWidgets: WidgetInstance[]
  layouts: Layouts
  updateLayouts: (breakpoint: string, nextLayout: Layout[]) => void
  updateWidgetSettings: (id: string, settings: Record<string, unknown>) => void
  toggleWidgetVisibility: (id: string, visible?: boolean) => void
  resetLayouts: () => void
  saveLayouts: () => void
}

const WidgetLayoutContext = createContext<WidgetLayoutContextValue | undefined>(undefined)

const serialize = (states: WidgetState[]) => {
  if (!isBrowser) return
  window.localStorage.setItem(WIDGET_LAYOUT_STORAGE_KEY, JSON.stringify(states))
}

const deserialize = (): WidgetState[] | null => {
  if (!isBrowser) return null

  const raw = window.localStorage.getItem(WIDGET_LAYOUT_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as WidgetState[]
  } catch (error) {
    console.warn('Failed to parse widget layouts from storage', error)
    return null
  }
}

const coerceLayouts = (layouts: Layouts | undefined, widgetId: string, minW?: number, minH?: number): Layouts => {
  const next: Layouts = {}
  Object.entries(layouts ?? {}).forEach(([breakpoint, layoutArray]) => {
    const typedLayouts = Array.isArray(layoutArray) ? (layoutArray as Layout[]) : []
    next[breakpoint] = typedLayouts.map((layout) => ({
      ...layout,
      i: widgetId,
      minW: minW ?? layout.minW,
      minH: minH ?? layout.minH,
    }))
  })
  return next
}

const mergeStatesWithDefinitions = (definitions: WidgetDefinition[], states: WidgetState[]): WidgetInstance[] => {
  const stateMap = new Map(states.map((state) => [state.id, state]))
  return definitions.map((definition) => {
    const state = stateMap.get(definition.id)
    const mergedLayouts = coerceLayouts(state?.layouts ?? definition.defaultLayouts, definition.id, definition.minW, definition.minH)
    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      render: definition.render,
      defaultLayouts: definition.defaultLayouts,
      minH: definition.minH,
      minW: definition.minW,
      settings: state?.settings ?? definition.settings ?? {},
      visible: state?.visible ?? true,
      layouts: mergedLayouts,
    }
  })
}

const deriveLayouts = (widgets: WidgetInstance[]): Layouts => {
  const layouts: Layouts = {}

  widgets.forEach((widget) => {
    Object.entries(widget.layouts ?? {}).forEach(([breakpoint, layoutArray]) => {
      const typedLayouts = Array.isArray(layoutArray) ? (layoutArray as Layout[]) : []
      if (!layouts[breakpoint]) {
        layouts[breakpoint] = []
      }
      if (widget.visible) {
        layouts[breakpoint]!.push(
          ...typedLayouts.map((layout) => ({
            ...layout,
            i: widget.id,
            minW: widget.minW ?? layout.minW,
            minH: widget.minH ?? layout.minH,
          }))
        )
      }
    })
  })

  return layouts
}

interface WidgetLayoutProviderProps {
  definitions: WidgetDefinition[]
  children: ReactNode
}

export function WidgetLayoutProvider({ definitions, children }: WidgetLayoutProviderProps) {
  const [states, setStates] = useState<WidgetState[]>(() => {
    const stored = deserialize()
    if (stored) return stored
    return definitions.map((definition) => ({
      id: definition.id,
      layouts: coerceLayouts(definition.defaultLayouts, definition.id, definition.minW, definition.minH),
      settings: definition.settings ?? {},
      visible: true,
    }))
  })

  const widgets = useMemo(() => mergeStatesWithDefinitions(definitions, states), [definitions, states])
  const visibleWidgets = useMemo(() => widgets.filter((widget) => widget.visible), [widgets])
  const layouts = useMemo(() => deriveLayouts(widgets), [widgets])

  useEffect(() => {
    serialize(states)
  }, [states])

  const saveLayouts = useCallback(() => {
    serialize(states)
  }, [states])

  const updateLayouts = useCallback(
    (breakpoint: string, nextLayout: Layout[]) => {
      setStates((previous) =>
        previous.map((state) => {
          const widgetLayout = nextLayout.find((layout) => layout.i === state.id)
          if (!widgetLayout) return state

          const breakpointLayouts = (state.layouts[breakpoint] ?? []) as Layout[]
          const merged = breakpointLayouts.map((layout) => (layout.i === state.id ? { ...layout, ...widgetLayout } : layout))

          const hasExisting = breakpointLayouts.some((layout) => layout.i === state.id)
          const nextBreakpointLayouts = hasExisting ? merged : [...breakpointLayouts, widgetLayout]

          return {
            ...state,
            layouts: {
              ...state.layouts,
              [breakpoint]: nextBreakpointLayouts,
            },
          }
        })
      )
    },
    []
  )

  const updateWidgetSettings = useCallback((id: string, settings: Record<string, unknown>) => {
    setStates((previous) =>
      previous.map((state) => (state.id === id ? { ...state, settings: { ...state.settings, ...settings } } : state))
    )
  }, [])

  const toggleWidgetVisibility = useCallback((id: string, visible?: boolean) => {
    setStates((previous) =>
      previous.map((state) => (state.id === id ? { ...state, visible: visible ?? !state.visible } : state))
    )
  }, [])

  const resetLayouts = useCallback(() => {
    const defaults = definitions.map((definition) => ({
      id: definition.id,
      layouts: coerceLayouts(definition.defaultLayouts, definition.id, definition.minW, definition.minH),
      settings: definition.settings ?? {},
      visible: true,
    }))
    setStates(defaults)
    if (isBrowser) {
      window.localStorage.removeItem(WIDGET_LAYOUT_STORAGE_KEY)
    }
  }, [definitions])

  const value = useMemo<WidgetLayoutContextValue>(
    () => ({
      widgets,
      visibleWidgets,
      layouts,
      updateLayouts,
      updateWidgetSettings,
      toggleWidgetVisibility,
      resetLayouts,
      saveLayouts,
    }),
    [layouts, resetLayouts, saveLayouts, toggleWidgetVisibility, updateLayouts, updateWidgetSettings, visibleWidgets, widgets]
  )

  return <WidgetLayoutContext.Provider value={value}>{children}</WidgetLayoutContext.Provider>
}

export const useWidgetLayoutContext = () => {
  const context = useContext(WidgetLayoutContext)
  if (!context) {
    throw new Error('useWidgetLayoutContext must be used within a WidgetLayoutProvider')
  }
  return context
}

