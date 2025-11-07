import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

import type { ChartJS } from '../components/charts/ChartRegistry'

const SCHEDULE_STORAGE_KEY = 'comedyinsight.dashboard.scheduledReports'
const isBrowser = typeof window !== 'undefined'

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `report-${Math.random().toString(36).slice(2, 11)}`
}

export interface CsvColumn<T> {
  key: keyof T | string
  header?: string
  formatter?: (value: unknown, row: T) => string | number | null | undefined
}

export interface ScheduleOptions {
  name: string
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
  recipients: string[]
  dataSource: string
  customIntervalMs?: number
  startAt?: Date
  metadata?: Record<string, unknown>
}

export interface ScheduledReport extends ScheduleOptions {
  id: string
  createdAt: string
  nextRunAt: string
  lastRunAt?: string
  enabled: boolean
}

type TableRow = Record<string, string | number | boolean | null | undefined>

const downloadBlob = (blob: Blob, filename: string) => {
  saveAs(blob, filename)
}

const escapeForCsv = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function exportToCSV<T extends TableRow>(filename: string, rows: T[], columns?: CsvColumn<T>[]): void {
  if (!rows.length) {
    const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
    return
  }

  const headers = columns
    ? columns.map((column) => column.header ?? String(column.key))
    : Object.keys(rows[0])

  const csvLines = [headers.join(',')]

  rows.forEach((row) => {
    const values = columns
      ? columns.map((column) => {
          const rawValue = column.key in row ? row[column.key as keyof T] : null
          const formatted = column.formatter ? column.formatter(rawValue, row) : rawValue
          return escapeForCsv(formatted)
        })
      : Object.values(row).map(escapeForCsv)
    csvLines.push(values.join(','))
  })

  const csvContent = csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

interface ExportElementOptions {
  scale?: number
  landscape?: boolean
  margin?: number
  filename?: string
}

export async function exportElementToPDF(element: HTMLElement, { scale = 2, landscape = false, margin = 24, filename = 'report.pdf' }: ExportElementOptions = {}) {
  const canvas = await html2canvas(element, { scale })
  const imageData = canvas.toDataURL('image/png')
  const orientation = landscape ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' })

  const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2
  const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2

  let renderWidth = pageWidth
  let renderHeight = (canvas.height * renderWidth) / canvas.width

  if (renderHeight > pageHeight) {
    renderHeight = pageHeight
    renderWidth = (canvas.width * renderHeight) / canvas.height
  }

  pdf.addImage(imageData, 'PNG', margin, margin, renderWidth, renderHeight)
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

export async function exportTableToPDF(tableElement: HTMLElement, options?: ExportElementOptions) {
  await exportElementToPDF(tableElement, options)
}

interface ExportChartOptions {
  filename?: string
  mimeType?: 'image/png' | 'image/jpeg'
  quality?: number
}

export function exportChartImage(chartOrCanvas: ChartJS | HTMLCanvasElement, { filename = 'chart.png', mimeType = 'image/png', quality = 0.92 }: ExportChartOptions = {}) {
  const canvas = chartOrCanvas instanceof HTMLCanvasElement ? chartOrCanvas : chartOrCanvas.ctx.canvas
  const dataUrl = canvas.toDataURL(mimeType, quality)
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '')
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: mimeType })
  downloadBlob(blob, filename)
}

const calculateNextRun = (options: ScheduleOptions): Date => {
  const start = options.startAt ?? new Date()
  const base = new Date(start)

  switch (options.frequency) {
    case 'hourly':
      base.setHours(base.getHours() + 1)
      break
    case 'daily':
      base.setDate(base.getDate() + 1)
      break
    case 'weekly':
      base.setDate(base.getDate() + 7)
      break
    case 'monthly':
      base.setMonth(base.getMonth() + 1)
      break
    case 'custom':
      base.setMilliseconds(base.getMilliseconds() + (options.customIntervalMs ?? 0))
      break
    default:
      break
  }

  return base
}

const serializeReports = (reports: ScheduledReport[]) => {
  if (!isBrowser) return
  window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(reports))
}

const deserializeReports = (): ScheduledReport[] => {
  if (!isBrowser) return []

  const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as ScheduledReport[]
    return parsed
  } catch (error) {
    console.warn('Failed to parse scheduled reports from storage', error)
    return []
  }
}

export function loadScheduledReports(): ScheduledReport[] {
  return deserializeReports()
}

export function updateScheduledReport(reportId: string, updater: (report: ScheduledReport) => ScheduledReport): ScheduledReport | null {
  const reports = deserializeReports()
  const index = reports.findIndex((entry) => entry.id === reportId)
  if (index === -1) return null

  const updated = updater(reports[index])
  reports[index] = updated
  serializeReports(reports)
  return updated
}

export function deleteScheduledReport(reportId: string): void {
  const reports = deserializeReports()
  const filtered = reports.filter((report) => report.id !== reportId)
  serializeReports(filtered)
}

export function scheduleReport(options: ScheduleOptions): ScheduledReport {
  const reports = deserializeReports()
  const id = createId()
  const createdAt = new Date().toISOString()
  const nextRunAt = calculateNextRun(options).toISOString()

  const report: ScheduledReport = {
    ...options,
    id,
    createdAt,
    nextRunAt,
    enabled: true,
  }

  reports.push(report)
  serializeReports(reports)

  return report
}

export function toggleScheduledReport(reportId: string, enabled: boolean): ScheduledReport | null {
  return updateScheduledReport(reportId, (report) => ({
    ...report,
    enabled,
  }))
}

export function markReportRun(reportId: string): ScheduledReport | null {
  return updateScheduledReport(reportId, (report) => ({
    ...report,
    lastRunAt: new Date().toISOString(),
    nextRunAt: calculateNextRun(report).toISOString(),
  }))
}

