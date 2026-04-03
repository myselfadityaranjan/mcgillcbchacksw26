/**
 * Assessment step definitions — the 5 guided movements.
 * These are static config consumed by the assessment flow.
 */

import type { AssessmentStep } from '@/types'

export const ASSESSMENT_STEPS: AssessmentStep[] = [
  {
    id: 'front_stance',
    label: 'Front Stance',
    description: 'Stand naturally facing the camera',
    instructionText: 'Stand upright, arms relaxed at your sides, feet shoulder-width apart. Look straight ahead.',
    tips: [
      'Keep your arms loose — don\'t try to "fix" your posture',
      'Stand as you normally would',
      'Look directly at the camera',
    ],
    countdownSeconds: 5,
    captureSeconds: 3,
    cameraAngle: 'front',
    isOptional: false,
    iconName: 'User',
  },
  {
    id: 'side_stance',
    label: 'Side Stance',
    description: 'Turn 90° and stand naturally',
    instructionText: 'Turn to your right side so your left side faces the camera. Stand relaxed, arms at your sides.',
    tips: [
      'This view reveals head, spine, and pelvis alignment',
      'Keep your arms loose at your sides',
      'Don\'t adjust your posture — we want to see your natural stance',
    ],
    countdownSeconds: 5,
    captureSeconds: 3,
    cameraAngle: 'side',
    isOptional: false,
    iconName: 'ArrowRight',
  },
  {
    id: 'overhead_raise',
    label: 'Overhead Arm Raise',
    description: 'Raise both arms straight overhead',
    instructionText: 'Face the camera and slowly raise both arms straight up overhead. Hold them there.',
    tips: [
      'Raise both arms at the same time',
      'Keep your arms as straight as possible',
      'Notice if one arm feels tighter than the other',
    ],
    countdownSeconds: 5,
    captureSeconds: 3,
    cameraAngle: 'front',
    isOptional: false,
    iconName: 'ArrowUp',
  },
  {
    id: 'bodyweight_squat',
    label: 'Bodyweight Squat',
    description: 'Perform a slow squat to parallel depth',
    instructionText: 'Face the camera. Feet shoulder-width apart. Slowly lower into a squat to parallel — hold the bottom position.',
    tips: [
      'Go only as deep as feels comfortable',
      'Keep your chest up and look forward',
      'Let your knees track naturally — don\'t force them out',
    ],
    countdownSeconds: 5,
    captureSeconds: 3,
    cameraAngle: 'front',
    isOptional: false,
    iconName: 'ChevronDown',
  },
  {
    id: 'single_leg_balance',
    label: 'Single-Leg Balance',
    description: 'Stand on one leg for 5 seconds',
    instructionText: 'Face the camera. Lift your right foot slightly off the ground and balance on your left leg. Stay as still as you can.',
    tips: [
      'Focus on a fixed point for better balance',
      'Allow your arms to move naturally for balance',
      'If you wobble, that\'s useful data — don\'t worry',
    ],
    countdownSeconds: 5,
    captureSeconds: 5,
    cameraAngle: 'front',
    isOptional: true,
    iconName: 'Flame',
  },
]
