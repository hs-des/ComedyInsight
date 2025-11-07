import type { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export default function SkeletonBlock({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton rounded-lg ${className}`} style={style} />
}

