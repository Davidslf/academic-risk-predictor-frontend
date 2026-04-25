/**
 * Skeleton — shimmer placeholder components for loading states.
 * Uses the .skeleton CSS class from index.css (background-size animation).
 */

interface SkeletonProps {
  className?: string
  /** Convenience: override border-radius */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const radiusMap = {
  sm:   'rounded-sm',
  md:   'rounded-md',
  lg:   'rounded-lg',
  xl:   'rounded-xl',
  '2xl':'rounded-2xl',
  full: 'rounded-full',
}

/** Base skeleton block — composable. */
export function Skeleton({ className = '', rounded = 'lg' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${radiusMap[rounded]} ${className}`}
    />
  )
}

/** Single text line skeleton. */
export function SkeletonText({ width = 'w-full', className = '' }: { width?: string; className?: string }) {
  return <Skeleton rounded="full" className={`h-3.5 ${width} ${className}`} />
}

/** Avatar / circular skeleton. */
export function SkeletonAvatar({ size = 10 }: { size?: number }) {
  return <Skeleton rounded="full" className={`w-${size} h-${size} flex-shrink-0`} />
}

/** Card-shaped skeleton for list rows. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-card" aria-hidden="true">
      <SkeletonAvatar size={9} />
      <div className="flex-1 space-y-2">
        <SkeletonText width="w-2/5" />
        <SkeletonText width="w-1/3" />
      </div>
      <SkeletonText width="w-16" />
      <SkeletonText width="w-20" />
    </div>
  )
}

/** Full table-body skeleton (n rows). */
export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-label="Cargando datos…" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  )
}

/** Card skeleton for stat tiles. */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-5 space-y-3 ${className}`} aria-hidden="true">
      <div className="flex justify-between items-start">
        <SkeletonText width="w-24" />
        <Skeleton rounded="lg" className="w-8 h-8" />
      </div>
      <SkeletonText width="w-16" className="h-7" />
      <SkeletonText width="w-32" />
    </div>
  )
}
