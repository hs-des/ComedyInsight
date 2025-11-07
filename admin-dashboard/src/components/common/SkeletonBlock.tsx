interface SkeletonProps {
  className?: string
}

export default function SkeletonBlock({ className = '' }: SkeletonProps) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

