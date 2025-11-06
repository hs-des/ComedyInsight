import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FileText, User, Calendar } from 'lucide-react'

interface AuditLog {
  id: string
  user_id: string
  username: string
  email: string
  action: string
  resource_type: string
  resource_id: string
  old_values: Record<string, any>
  new_values: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
}

export default function AuditLogsPage() {
  const { data: logs = [], isLoading, error } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/audit-logs')
      console.log('Audit logs API Response:', response.data)
      return response.data || []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('CREATE')) {
      return 'bg-green-900 text-green-300'
    }
    if (action.includes('UPDATE') || action.includes('UPDATE')) {
      return 'bg-blue-900 text-blue-300'
    }
    if (action.includes('DELETE') || action.includes('DELETE')) {
      return 'bg-red-900 text-red-300'
    }
    return 'bg-gray-900 text-gray-300'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading audit logs...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading audit logs: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Action</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Resource</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">IP Address</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <div>
                          <div className="text-white font-medium">{log.username || 'System'}</div>
                          <div className="text-gray-400 text-xs">{log.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white text-sm">{log.resource_type}</div>
                        <div className="text-gray-400 text-xs">{log.resource_id.substring(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{log.ip_address || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
