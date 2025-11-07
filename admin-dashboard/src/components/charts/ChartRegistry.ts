import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js'

let isRegistered = false

export const ensureChartDefaults = () => {
  if (isRegistered) return

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    TimeScale,
    Tooltip,
    Legend,
    Title,
    Filler
  )

  ChartJS.defaults.font.family = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  ChartJS.defaults.color = '#475569'
  ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.3)'
  ChartJS.defaults.plugins.legend.position = 'bottom'
  ChartJS.defaults.plugins.tooltip.backgroundColor = '#0f172a'
  ChartJS.defaults.plugins.tooltip.titleColor = '#f1f5f9'
  ChartJS.defaults.plugins.tooltip.bodyColor = '#e2e8f0'
  ChartJS.defaults.plugins.tooltip.borderColor = '#1e293b'
  ChartJS.defaults.plugins.tooltip.borderWidth = 1
  ChartJS.defaults.plugins.tooltip.displayColors = false

  isRegistered = true
}

export type { ChartJS }

