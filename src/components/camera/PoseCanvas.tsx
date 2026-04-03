import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface PoseCanvasProps {
  className?: string
  mirror?: boolean
}

/**
 * The overlay canvas that Person 3 (Task 6) draws onto.
 * Positioned absolutely over the CameraFeed.
 * Person 1 + 6 both receive this ref to draw skeleton and annotations.
 */
export const PoseCanvas = forwardRef<HTMLCanvasElement, PoseCanvasProps>(
  ({ className, mirror }, ref) => {
    return (
      <canvas
        ref={ref}
        className={cn(
          'absolute inset-0 w-full h-full pointer-events-none',
          mirror && 'scale-x-[-1]',
          className
        )}
        aria-hidden="true"
      />
    )
  }
)

PoseCanvas.displayName = 'PoseCanvas'
