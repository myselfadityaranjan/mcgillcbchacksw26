/**
 * Analytics bus — pluggable telemetry layer.
 *
 * Usage:
 *   analytics.track('drill_started', { drillId: 'wall_angel' })
 *
 * To plug in a real backend, call analytics.register(handler) once at startup:
 *   analytics.register((event) => mixpanel.track(event.name, event.properties))
 */

import type { AnalyticsEvent, AnalyticsEventName, AnalyticsHandler } from '@/types'

class Analytics {
  private handlers: AnalyticsHandler[] = []
  private enabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  private queue: AnalyticsEvent[] = []

  /** Register a handler that receives all future events */
  register(handler: AnalyticsHandler): () => void {
    this.handlers.push(handler)
    // Replay queued events for this new handler
    this.queue.forEach((event) => handler(event))
    this.queue = []
    // Return unregister function
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  /** Emit a named event with optional properties */
  track(
    name: AnalyticsEventName,
    properties?: Record<string, string | number | boolean | null>
  ): void {
    if (!this.enabled) return

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    }

    if (this.handlers.length === 0) {
      // Queue until a handler is registered
      this.queue.push(event)
      return
    }

    this.handlers.forEach((h) => {
      try {
        h(event)
      } catch {
        // Never let analytics errors propagate
      }
    })
  }

  /** Enable/disable at runtime (e.g. user toggles consent) */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

export const analytics = new Analytics()
