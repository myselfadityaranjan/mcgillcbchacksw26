/**
 * Assessment types — the guided movement scan flow.
 * Person 1 (Task 1) captures frames during each step.
 * This data feeds the analysis engine (Task 2).
 */

import type { PoseFrame } from './pose'

/** The 5 supported assessment movements */
export type AssessmentMovement =
  | 'front_stance'
  | 'side_stance'
  | 'overhead_raise'
  | 'bodyweight_squat'
  | 'single_leg_balance'

/** Status of a single assessment step */
export type AssessmentStepStatus =
  | 'pending'       // not started
  | 'active'        // countdown running, capturing
  | 'capturing'     // holding still, recording frames
  | 'complete'      // frames captured and saved
  | 'skipped'       // user skipped this step

/** Configuration for a single step in the assessment */
export interface AssessmentStep {
  id: AssessmentMovement
  label: string
  description: string
  instructionText: string
  tips: string[]
  countdownSeconds: number    // how long to prepare
  captureSeconds: number      // how long to hold and capture
  cameraAngle: 'front' | 'side' | 'both'
  isOptional: boolean
  iconName: string            // lucide icon name
}

/** State of a step during the live session */
export interface AssessmentStepState {
  step: AssessmentStep
  status: AssessmentStepStatus
  frames: PoseFrame[]         // captured during this step
  representativeFrame: PoseFrame | null  // best frame for annotation
  startedAt: number | null
  completedAt: number | null
}

/** Full assessment session — what the analysis engine consumes */
export interface AssessmentSession {
  id: string
  startedAt: number
  completedAt: number | null
  steps: AssessmentStepState[]
  deviceInfo: DeviceInfo
}

/** Snapshot of device context for debugging / analytics */
export interface DeviceInfo {
  userAgent: string
  screenWidth: number
  screenHeight: number
  cameraLabel: string
  cameraWidth: number
  cameraHeight: number
}

/** Overall status of the assessment flow */
export type AssessmentStatus =
  | 'idle'
  | 'setup'
  | 'calibrating'
  | 'scanning'
  | 'complete'
  | 'error'
