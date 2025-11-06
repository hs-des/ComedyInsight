import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export default function PlaceholderPage({ title, description = 'This page is coming soon.' }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-900/30 rounded-full mb-6">
          <Construction className="text-yellow-400" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
        <p className="text-gray-400 text-lg">{description}</p>
      </div>
    </div>
  )
}
