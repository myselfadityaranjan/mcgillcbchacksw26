import { useCallback } from 'react'
import { analytics } from '@/lib/analytics'
import type { AnalyticsEventName } from '@/types'

/** Hook wrapper around the analytics singleton */
export function useAnalytics() {
  const track = useCallback(
    (
      name: AnalyticsEventName,
      properties?: Record<string, string | number | boolean | null>
    ) => {
      analytics.track(name, properties)
    },
    []
  )

  return { track }
}
