import { Fragment, useMemo, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout as GridLayout, Layouts as GridLayouts } from 'react-grid-layout'
import { PlusCircle, RotateCcw } from 'lucide-react'

import { useWidgetLayout } from '../../hooks/useWidgetLayout'
import { WidgetContainer } from './WidgetContainer'
import { WidgetSettingsPanel } from './WidgetSettingsPanel'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

const DEFAULT_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const DEFAULT_COLS = { lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 }

interface WidgetGridProps {
  rowHeight?: number
  margin?: [number, number]
  padding?: [number, number]
  className?: string
}

export function WidgetGrid({ rowHeight = 30, margin = [16, 16], padding = [16, 16], className = '' }: WidgetGridProps) {
  const { widgets, layouts, updateLayouts, toggleWidgetVisibility, updateWidgetSettings, resetLayouts, orderedVisibleWidgets } = useWidgetLayout()
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null)

  const settingsWidget = useMemo(() => widgets.find((widget) => widget.id === settingsWidgetId) ?? null, [settingsWidgetId, widgets])

  const handleLayoutChange = (_layout: GridLayout[], allLayouts: GridLayouts) => {
    Object.entries(allLayouts).forEach(([breakpoint, layout]) => {
      const typedLayout = Array.isArray(layout) ? (layout as GridLayout[]) : []
      updateLayouts(breakpoint, typedLayout)
    })
  }

  const handleAddHiddenWidget = (id: string) => {
    toggleWidgetVisibility(id, true)
  }

  const hiddenWidgets = useMemo(() => widgets.filter((widget) => !widget.visible), [widgets])

  return (
    <Fragment>
      <div className={`space-y-4 ${className}`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetLayouts}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
          >
            <RotateCcw className="h-4 w-4" /> Reset layout
          </button>
          {hiddenWidgets.map((widget) => (
            <button
              key={widget.id}
              type="button"
              onClick={() => handleAddHiddenWidget(widget.id)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
            >
              <PlusCircle className="h-4 w-4" /> Add {widget.title}
            </button>
          ))}
        </div>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={DEFAULT_BREAKPOINTS}
          cols={DEFAULT_COLS}
          margin={margin}
          containerPadding={padding}
          rowHeight={rowHeight}
          draggableHandle="header"
          onLayoutChange={handleLayoutChange}
        >
          {orderedVisibleWidgets.map((widget) => (
            <div key={widget.id}>
              <WidgetContainer widget={widget} onOpenSettings={(current) => setSettingsWidgetId(current.id)} />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
      <WidgetSettingsPanel
        widget={settingsWidget}
        open={Boolean(settingsWidgetId)}
        onClose={() => setSettingsWidgetId(null)}
        onSaveSettings={updateWidgetSettings}
        onToggleVisibility={toggleWidgetVisibility}
      />
    </Fragment>
  )
}

