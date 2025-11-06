import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Edit, Trash2 } from 'lucide-react'

interface Subtitle {
  id: string
  video_id: string
  language: string
  subtitle_url: string
  created_at: string
}

export default function SubtitlesPage() {
  const { data: subtitles = [], isLoading, error } = useQuery<Subtitle[]>({
    queryKey: ['subtitles'],
    queryFn: async () => {
      // Note: We'll need to create an endpoint for this or fetch from videos
      // For now, returning empty array
      return []
    },
    staleTime: 0,
    refetchOnMount: true,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Subtitles</h1>
      </div>

      {isLoading && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading subtitles...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded-lg border border-red-700 p-4 text-center">
          <p className="text-red-300">Error loading subtitles: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400 mb-4">Subtitles are managed per video. Go to a video's detail page to upload or manage subtitles.</p>
          <p className="text-gray-500 text-sm">Currently showing {subtitles.length} subtitles in the system.</p>
        </div>
      )}
    </div>
  )
}
