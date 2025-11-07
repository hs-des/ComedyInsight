import { useEffect, useMemo, useState } from 'react'

import type { WidgetInstance } from '../../contexts/WidgetLayoutContext'

interface WidgetSettingsPanelProps {
  widget: WidgetInstance | null
  open: boolean
  onClose: () => void
  onSaveSettings: (id: string, settings: Record<string, unknown>) => void
  onToggleVisibility: (id: string, visible: boolean) => void
}

type SettingValue = string | number | boolean | Record<string, unknown>

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export function WidgetSettingsPanel({ widget, open, onClose, onSaveSettings, onToggleVisibility }: WidgetSettingsPanelProps) {
  const [draftSettings, setDraftSettings] = useState<Record<string, SettingValue>>({})
  const [rawJson, setRawJson] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    if (!widget) return

    setDraftSettings({ ...widget.settings })
    const customSettings = Object.entries(widget.settings).filter(([, value]) => isObject(value))
    setRawJson(customSettings.length ? JSON.stringify(Object.fromEntries(customSettings), null, 2) : '{}')
    setJsonError(null)
  }, [widget])

  const simpleFields = useMemo(() => {
    if (!widget) return [] as Array<[string, SettingValue]>
    return Object.entries(widget.settings).filter(([, value]) => !isObject(value)) as Array<[string, SettingValue]>
  }, [widget])

  if (!widget) return null

  const handleSave = () => {
    if (jsonError) return

    let parsedJson: Record<string, unknown> = {}
    if (rawJson.trim()) {
      try {
        parsedJson = JSON.parse(rawJson)
      } catch (error) {
        setJsonError('Invalid JSON configuration')
        return
      }
    }

    const mergedSettings = {
      ...draftSettings,
      ...parsedJson,
    }
    onSaveSettings(widget.id, mergedSettings)
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-50 transform bg-slate-900/40 backdrop-blur-sm transition-opacity ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!open}
    >
      <div className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white shadow-xl transition-transform dark:bg-slate-900 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <header className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{widget.title} settings</h2>
            {widget.description && <p className="text-sm text-slate-500 dark:text-slate-400">{widget.description}</p>}
          </header>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <section>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Show widget</span>
                <button
                  type="button"
                  onClick={() => onToggleVisibility(widget.id, !widget.visible)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${widget.visible ? 'bg-slate-900 dark:bg-slate-200' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className="sr-only">Toggle widget visibility</span>
                  <span className={`inline-block h-4 w-4 transform rounded-full transition ${widget.visible ? 'translate-x-6 bg-white' : 'translate-x-1 bg-slate-500'}`} />
                </button>
              </div>
            </section>

            {simpleFields.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quick settings</h3>
                {simpleFields.map(([key, value]) => {
                  const currentValue = draftSettings[key]
                  const booleanValue = typeof currentValue === 'boolean' ? currentValue : Boolean(currentValue)

                  return (
                    <label key={key} className="block text-sm">
                      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{key}</span>
                    {typeof value === 'boolean' ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSettings((previous) => {
                              const current = previous[key]
                              const nextValue = typeof current === 'boolean' ? !current : !booleanValue
                              return {
                                ...previous,
                                [key]: nextValue,
                              }
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${booleanValue ? 'bg-slate-900 dark:bg-slate-200' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <span className="sr-only">Toggle {key}</span>
                          <span className={`inline-block h-4 w-4 transform rounded-full transition ${booleanValue ? 'translate-x-6 bg-white' : 'translate-x-1 bg-slate-500'}`} />
                        </button>
                      </div>
                    ) : (
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                        value={draftSettings[key] as string | number | undefined}
                        onChange={(event) => {
                          const newValue = typeof value === 'number' ? Number(event.target.value) : event.target.value
                          setDraftSettings((previous) => ({ ...previous, [key]: newValue }))
                        }}
                      />
                    )}
                    </label>
                  )
                })}
              </section>
            )}

            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Advanced JSON settings</h3>
                {jsonError && <span className="text-xs text-red-500">{jsonError}</span>}
              </div>
              <textarea
                value={rawJson}
                onChange={(event) => {
                  setRawJson(event.target.value)
                  try {
                    JSON.parse(event.target.value)
                    setJsonError(null)
                  } catch (error) {
                    setJsonError('Invalid JSON configuration')
                  }
                }}
                rows={8}
                className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              />
            </section>
          </div>
          <footer className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={Boolean(jsonError)}
              onClick={handleSave}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
            >
              Save changes
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}

