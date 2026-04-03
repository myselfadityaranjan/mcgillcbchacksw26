/**
 * App-wide constants — single source of truth for magic numbers and strings.
 */

export const APP_NAME = 'StrainSense'
export const APP_TAGLINE = 'See where your body is unstable. Fix it before strain becomes injury.'
export const APP_VERSION = '1.0.0'

// Assessment
export const ASSESSMENT_CALIBRATION_TIMEOUT_MS = 30_000
export const ASSESSMENT_COUNTDOWN_SECONDS = 5
export const ASSESSMENT_CAPTURE_SECONDS = 3
export const ASSESSMENT_MIN_FRAMES = 15        // minimum frames needed per step
export const ASSESSMENT_MIN_CONFIDENCE = 0.6   // minimum pose detection confidence

// Calibration thresholds
export const CALIBRATION_MIN_VISIBILITY = 0.7  // for key landmarks
export const CALIBRATION_MIN_BODY_COVERAGE = 0.7  // fraction of expected landmarks visible

// Coaching
export const COACHING_FPS_TARGET = 30
export const COACHING_SCORE_SMOOTHING_FACTOR = 0.15
export const COACHING_SCORE_HISTORY_FRAMES = 60
export const COACHING_UNSAFE_CONFIRM_FRAMES = 3   // consecutive red frames before unsafe alert

// Scoring
export const SCORE_EXCELLENT = 85
export const SCORE_GOOD = 70
export const SCORE_FAIR = 50

// UI
export const TOAST_DEFAULT_DURATION_MS = 4000
export const PAGE_TRANSITION_DURATION_MS = 300
export const OVERLAY_CANVAS_FPS = 30

// Storage
export const STORAGE_KEY_SESSIONS = 'strainsense-sessions'
export const STORAGE_KEY_UI_PREFS = 'strainsense-ui-prefs'
export const MAX_STORED_SESSIONS = 20

// Routes
export const ROUTES = {
  HOME: '/',
  SETUP: '/setup',
  SCAN: '/scan',
  ANALYZING: '/analyzing',
  RESULTS: '/results',
  DRILL: '/drill/:drillId',
  COACHING: '/coach/:drillId',
  COMPLETE: '/complete',
} as const

// Safety disclaimer
export const DISCLAIMER_TEXT =
  'StrainSense is a corrective movement support tool, not a diagnostic or medical device. ' +
  'Stop immediately if you feel sharp or severe pain. Seek professional care if symptoms worsen. ' +
  'This tool does not replace physical therapy or medical advice.'

// Issue display config
export const ISSUE_SEVERITY_LABELS: Record<string, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  significant: 'Significant',
}

export const ISSUE_SEVERITY_COLORS: Record<string, string> = {
  mild: 'warning',
  moderate: 'warning',
  significant: 'danger',
}

export const BODY_REGION_LABELS: Record<string, string> = {
  head_neck: 'Head & Neck',
  shoulders: 'Shoulders',
  thoracic_spine: 'Upper Back',
  lumbar_spine: 'Lower Back',
  hips_pelvis: 'Hips & Pelvis',
  knees: 'Knees',
  ankles_feet: 'Ankles & Feet',
}
