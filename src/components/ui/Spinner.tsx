import { cn } from '@/lib/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'brand' | 'white' | 'success'
  className?: string
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
}

const colorMap = {
  brand: 'stroke-brand',
  white: 'stroke-white',
  success: 'stroke-success',
}

export function Spinner({ size = 'md', variant = 'brand', className }: SpinnerProps) {
  const px = sizeMap[size]
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin', colorMap[variant], className)}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" className="opacity-20" />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        className={colorMap[variant]}
        stroke="currentColor"
      />
    </svg>
  )
}

/** Full-page loading overlay */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center gap-4 z-50">
      <Spinner size="xl" />
      {message && <p className="text-text-2 text-sm">{message}</p>}
    </div>
  )
}
