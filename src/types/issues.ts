/**
 * Issue types — output of the analysis engine (Task 2 / Person 1).
 * The UI consumes DetectedIssue[] to render results and drive recommendations.
 */

/** The 5 supported postural / movement issues */
export type IssueId =
  | 'rounded_shoulders'
  | 'forward_head_posture'
  | 'anterior_pelvic_tilt'
  | 'knee_valgus'
  | 'lateral_asymmetry'

/** Body regions affected */
export type BodyRegion =
  | 'head_neck'
  | 'shoulders'
  | 'thoracic_spine'
  | 'lumbar_spine'
  | 'hips_pelvis'
  | 'knees'
  | 'ankles_feet'

/** How severe the detected issue is */
export type IssueSeverity = 'mild' | 'moderate' | 'significant'

/** Confidence in the detection */
export type IssueConfidence = 'low' | 'medium' | 'high'

/** Which side is affected (for asymmetric issues) */
export type LateralSide = 'left' | 'right' | 'bilateral' | 'none'

/**
 * A detected issue from the analysis engine.
 * Person 1 (Task 2) produces this; the UI renders it.
 */
export interface DetectedIssue {
  id: IssueId
  severity: IssueSeverity
  confidence: IssueConfidence
  side: LateralSide
  primaryRegion: BodyRegion
  affectedRegions: BodyRegion[]

  /** Key metric values that triggered this detection */
  metrics: IssueMetrics

  /** Frame index in the assessment step that best shows this issue */
  evidenceStepId: string
  evidenceFrameTimestamp: number

  /** Heatmap intensity for each body region (0–1) */
  strainMap: Partial<Record<BodyRegion, number>>
}

/** Numeric measurements that drove the detection */
export interface IssueMetrics {
  /** Deviation in degrees or normalised units */
  primaryDeviation: number
  /** Readable label for primaryDeviation, e.g. "head forward offset" */
  primaryDeviationLabel: string
  /** Optional secondary metric */
  secondaryDeviation?: number
  secondaryDeviationLabel?: string
  /** All raw values for debug / display */
  raw: Record<string, number>
}

/** Output contract from Person 1's analysis engine */
export interface AnalysisResult {
  sessionId: string
  analyzedAt: number
  issues: DetectedIssue[]
  /** Normalised overall score: 100 = perfect, lower = more issues */
  overallScore: number
  /** Frame timestamp of best evidence capture per step */
  evidenceFrames: Record<string, number>
}
