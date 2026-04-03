/**
 * Issue display metadata — human-readable copy for each issue type.
 * Kept separate from type definitions so copy changes don't touch the type system.
 */

import type { IssueId } from '@/types'

export interface IssueDisplayMeta {
  id: IssueId
  name: string
  shortName: string
  description: string
  whyItMatters: string
  whatItMayLeadTo: string[]
  relatedDrillIds: string[]
  bodyRegionLabel: string
  iconName: string
}

export const ISSUE_META: Record<IssueId, IssueDisplayMeta> = {
  rounded_shoulders: {
    id: 'rounded_shoulders',
    name: 'Rounded Shoulders',
    shortName: 'Rounded Shoulders',
    description:
      'Your shoulder positioning shows a pattern consistent with protraction — the shoulders appear to be pulled forward and inward.',
    whyItMatters:
      'This pattern tends to compress the shoulder joint, reduce thoracic mobility, and place sustained tension on the upper back muscles. Over time it may contribute to shoulder impingement and neck tightness.',
    whatItMayLeadTo: [
      'Upper back tightness and fatigue',
      'Reduced shoulder range of motion',
      'Pattern consistent with shoulder impingement risk',
      'Forward head posture tendency',
    ],
    relatedDrillIds: ['doorway_pec_stretch', 'wall_angel'],
    bodyRegionLabel: 'Shoulders & Upper Back',
    iconName: 'ArrowLeftRight',
  },
  forward_head_posture: {
    id: 'forward_head_posture',
    name: 'Forward Head Posture',
    shortName: 'Forward Head',
    description:
      'Your head sits forward of your shoulder line in the side view, a pattern consistent with forward head posture. For every inch forward, the effective load on your neck structures increases significantly.',
    whyItMatters:
      'This pattern places sustained mechanical load on the posterior cervical structures and may contribute to neck stiffness, headaches, and upper trapezius tension.',
    whatItMayLeadTo: [
      'Neck stiffness and restricted rotation',
      'Upper trapezius and suboccipital tension',
      'Pattern associated with tension headaches',
      'Breathing restriction tendency',
    ],
    relatedDrillIds: ['wall_angel'],
    bodyRegionLabel: 'Head & Neck',
    iconName: 'ArrowRight',
  },
  anterior_pelvic_tilt: {
    id: 'anterior_pelvic_tilt',
    name: 'Anterior Pelvic Tilt',
    shortName: 'Pelvic Tilt',
    description:
      'Your side-view posture shows a pattern consistent with anterior pelvic tilt — the pelvis appears tilted forward, creating increased lumbar lordosis.',
    whyItMatters:
      'This pattern is commonly linked to tight hip flexors and inhibited glutes. It tends to increase compressive load on the lower lumbar vertebrae during standing and movement.',
    whatItMayLeadTo: [
      'Lower back tightness and discomfort',
      'Hip flexor strain tendency during activity',
      'Reduced gluteal activation',
      'Hamstring over-recruitment',
    ],
    relatedDrillIds: ['hip_flexor_stretch'],
    bodyRegionLabel: 'Hips & Pelvis',
    iconName: 'RotateCcw',
  },
  knee_valgus: {
    id: 'knee_valgus',
    name: 'Knee Valgus',
    shortName: 'Knee Collapse',
    description:
      'During your squat, your knees showed an inward deviation relative to the hip-foot line — a pattern called knee valgus or "knee cave."',
    whyItMatters:
      'This pattern increases medial knee stress and is associated with patellofemoral pain and ACL stress patterns. It often reflects weak hip abductors and/or foot pronation.',
    whatItMayLeadTo: [
      'Pattern associated with patellofemoral (kneecap) pain',
      'Medial knee ligament stress tendency',
      'IT band tension',
      'Reduced squat and movement efficiency',
    ],
    relatedDrillIds: ['squat_alignment_drill', 'split_squat_control'],
    bodyRegionLabel: 'Knees',
    iconName: 'TriangleAlert',
  },
  lateral_asymmetry: {
    id: 'lateral_asymmetry',
    name: 'Left-Right Asymmetry',
    shortName: 'Asymmetry',
    description:
      'A left-right imbalance was detected in your shoulder height, hip level, or movement path — suggesting one side carries more load or has more restriction than the other.',
    whyItMatters:
      'Asymmetric loading patterns tend to create overuse on the more-used side over time and may indicate mobility restrictions or compensations from past injuries.',
    whatItMayLeadTo: [
      'Overuse injury tendency on the dominant side',
      'Muscle imbalances worsening over time',
      'Movement compensation patterns',
      'Hip and spinal asymmetry progression',
    ],
    relatedDrillIds: ['split_squat_control'],
    bodyRegionLabel: 'Full Body',
    iconName: 'Scale',
  },
}

export const getIssueMeta = (id: IssueId): IssueDisplayMeta => ISSUE_META[id]
