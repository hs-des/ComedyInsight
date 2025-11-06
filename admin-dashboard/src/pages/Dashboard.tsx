import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { TrendingUp, Users, Video, Eye, DollarSign } from 'lucide-react'

interface Stats {
  totalVideos: number
  totalUsers: number
  totalViews: number
  revenue: number
}

export default function Dashboard() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/stats')
      return response.data
    },
    placeholderData: { totalVideos: 1245, totalUsers: 8900, totalViews: 2500000, revenue: 125000 },
  })

  const statCards = [
    { label: 'Total Videos', value: stats?.totalVideos, icon: Video, color: 'bg-blue-500' },
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'bg-green-500' },
    { label: 'Total Views', value: stats?.totalViews?.toLocaleString(), icon: Eye, color: 'bg-purple-500' },
    { label: 'Revenue', value: `$${stats?.revenue?.toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-500' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.color} rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-700">
            <div>
              <p className="text-white font-medium">New video uploaded</p>
              <p className="text-gray-400 text-sm">"Funny Moments Compilation" by John Comedian</p>
            </div>
            <span className="text-gray-400 text-sm">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-700">
            <div>
              <p className="text-white font-medium">User registered</p>
              <p className="text-gray-400 text-sm">Email: user@example.com</p>
            </div>
            <span className="text-gray-400 text-sm">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white font-medium">Subscription renewed</p>
              <p className="text-gray-400 text-sm">Premium plan</p>
            </div>
            <span className="text-gray-400 text-sm">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

