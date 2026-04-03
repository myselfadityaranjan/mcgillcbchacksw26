/**
 * Analytics event types — pluggable telemetry layer.
 * Events are emitted through the analytics bus regardless of whether
 * a real analytics backend is configured. Plug in Mixpanel, Amplitude,
 * PostHog, etc. by registering a handler — zero consumer-side changes.
 */

export type AnalyticsEventName =
  // App lifecycle
  | 'app_loaded'
  | 'app_error'
  // Assessment flow
  | 'assessment_started'
  | 'assessment_step_started'
  | 'assessment_step_completed'
  | 'assessment_step_skipped'
  | 'assessment_completed'
  | 'assessment_abandoned'
  // Analysis
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  // Results
  | 'results_viewed'
  | 'issue_card_expanded'
  // Drills
  | 'drill_detail_viewed'
  | 'drill_started'
  | 'drill_completed'
  | 'drill_abandoned'
  // Coaching
  | 'coaching_cue_fired'
  | 'coaching_unsafe_event'
  | 'coaching_correction_made'
  // Session
  | 'session_completed'

export interface AnalyticsEvent {
  name: AnalyticsEventName
  properties?: Record<string, string | number | boolean | null>
  timestamp: number
}

/** Register a handler to receive all analytics events */
export type AnalyticsHandler = (event: AnalyticsEvent) => void
