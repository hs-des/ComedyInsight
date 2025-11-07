import AnalyticsCards from '../components/dashboard/AnalyticsCards'
import SystemStatusGrid from '../components/dashboard/SystemStatusGrid'
import ActivityTimeline from '../components/dashboard/ActivityTimeline'
import QuickAccessPanel from '../components/dashboard/QuickAccessPanel'
import ReportsPanel from '../components/dashboard/ReportsPanel'
import { DashboardWidgets } from '../components/dashboard/DashboardWidgets'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Welcome back, Admin ✨</h1>
          <p className="text-sm text-gray-400">Monitor platform health, review activity, and jump straight into your daily tasks.</p>
        </header>

        <AnalyticsCards />

        <section>
          <h2 className="text-xl font-semibold text-white">Interactive insights</h2>
          <p className="text-sm text-gray-400">Drag, resize, and tailor these widgets to match your monitoring flow.</p>
          <DashboardWidgets />
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ActivityTimeline />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <SystemStatusGrid />
            <ReportsPanel />
          </div>
        </div>

        <QuickAccessPanel />
      </div>
    </ErrorBoundary>
  )
}

