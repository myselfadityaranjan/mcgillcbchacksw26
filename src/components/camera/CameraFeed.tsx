import { useEffect, forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { useUiStore } from '@/store'

interface CameraFeedProps {
  stream: MediaStream | null
  mirror?: boolean
  className?: string
  onVideoReady?: () => void
}

/**
 * Renders the raw camera video element.
 * Person 1's pose engine receives this element's ref to attach MediaPipe.
 * Task 6 (Person 3) draws on the PoseCanvas layered on top of this element.
 */
export const CameraFeed = forwardRef<HTMLVideoElement, CameraFeedProps>(
  ({ stream, mirror, className, onVideoReady }, ref) => {
    const mirrorCamera = useUiStore((s) => s.mirrorCamera)
    const shouldMirror = mirror ?? mirrorCamera

    useEffect(() => {
      const video = ref && 'current' in ref ? ref.current : null
      if (!video || !stream) return
      video.srcObject = stream
      video.play().then(onVideoReady).catch(() => null)
    }, [stream, ref, onVideoReady])

    return (
      <video
        ref={ref}
        className={cn(
          'w-full h-full object-cover',
          shouldMirror && 'scale-x-[-1]',
          className
        )}
        autoPlay
        playsInline
        muted
        aria-label="Camera feed"
      />
    )
  }
)

CameraFeed.displayName = 'CameraFeed'
