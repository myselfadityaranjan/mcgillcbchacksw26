/**
 * Drill library — static configuration for all 5 corrective drills.
 * Person 2 (Task 3) should review/expand the threshold and cue definitions.
 */

import type { Drill } from '@/types'

export const DRILLS: Drill[] = [
  {
    id: 'doorway_pec_stretch',
    name: 'Doorway Pec Stretch',
    shortName: 'Pec Stretch',
    description:
      'Opens the chest and lengthens tight pectorals that pull the shoulders forward. Counteracts the rounding pattern caused by prolonged sitting or desk work.',
    targetIssues: ['rounded_shoulders'],
    primaryRegion: 'shoulders',
    affectedRegions: ['shoulders', 'thoracic_spine'],
    position: 'standing',
    difficulty: 'beginner',
    category: 'stretch',
    durationSeconds: 30,
    cues: [
      {
        id: 'chest_up',
        text: 'Lift your chest — don\'t let it collapse forward',
        joints: ['shoulders', 'thoracic_spine'],
        correctionArrowDirection: 'up',
      },
      {
        id: 'shoulder_blades',
        text: 'Draw shoulder blades gently together and down',
        joints: ['shoulders'],
        correctionArrowDirection: 'inward',
      },
      {
        id: 'neutral_neck',
        text: 'Keep your head neutral — ears over shoulders',
        joints: ['head_neck'],
        correctionArrowDirection: 'inward',
      },
    ],
    thresholds: [
      { metric: 'shoulderRetraction', greenMin: 5, greenMax: 40, yellowMin: 0, yellowMax: 5 },
      { metric: 'headForwardOffset', greenMin: 0, greenMax: 2, yellowMin: 2, yellowMax: 4 },
    ],
    setupInstructions: [
      'Stand in an open doorway',
      'Place both forearms on the door frame at roughly 90° elbow angle',
      'Step one foot forward through the doorway',
      'Gently lean your chest forward through the opening',
    ],
    unsafeConditions: [
      'Sharp or shooting pain in shoulder or arm',
      'Numbness or tingling down the arm',
      'Excessive neck strain',
    ],
    demoAsset: '/assets/drills/doorway-pec-stretch.webp',
  },
  {
    id: 'wall_angel',
    name: 'Wall Angel',
    shortName: 'Wall Angel',
    description:
      'Trains scapular mobility, thoracic extension, and shoulder retraction. Directly counteracts both rounded shoulders and forward head posture by reinforcing proper upper-body alignment.',
    targetIssues: ['rounded_shoulders', 'forward_head_posture'],
    primaryRegion: 'shoulders',
    affectedRegions: ['shoulders', 'thoracic_spine', 'head_neck'],
    position: 'wall',
    difficulty: 'beginner',
    category: 'mobility',
    durationSeconds: 60,
    reps: 10,
    cues: [
      {
        id: 'flatten_back',
        text: 'Press your entire back flat against the wall',
        joints: ['thoracic_spine', 'lumbar_spine'],
        correctionArrowDirection: 'inward',
      },
      {
        id: 'head_wall',
        text: 'Press the back of your head against the wall',
        joints: ['head_neck'],
        correctionArrowDirection: 'inward',
      },
      {
        id: 'slow_movement',
        text: 'Move slowly — no rushing through the range',
        joints: ['shoulders'],
      },
    ],
    thresholds: [
      { metric: 'spineWallContact', greenMin: 0.8, greenMax: 1.0, yellowMin: 0.5, yellowMax: 0.8 },
      { metric: 'headForwardOffset', greenMin: 0, greenMax: 1.5, yellowMin: 1.5, yellowMax: 3 },
    ],
    setupInstructions: [
      'Stand with your back against a flat wall',
      'Feet 4–6 inches from the base of the wall',
      'Flatten your lower back, upper back, and head against the wall',
      'Start with arms at 90° (goalpost position) pressed against the wall',
      'Slowly slide arms up overhead, keeping contact with the wall throughout',
    ],
    unsafeConditions: [
      'Sharp shoulder or rotator cuff pain',
      'Inability to keep back flat without significant back pain',
    ],
    demoAsset: '/assets/drills/wall-angel.webp',
  },
  {
    id: 'hip_flexor_stretch',
    name: 'Hip Flexor Stretch',
    shortName: 'Hip Flexor',
    description:
      'Lengthens tight hip flexors that pull the pelvis into anterior tilt. Reduces lower back strain and improves standing posture.',
    targetIssues: ['anterior_pelvic_tilt'],
    primaryRegion: 'hips_pelvis',
    affectedRegions: ['hips_pelvis', 'lumbar_spine'],
    position: 'kneeling',
    difficulty: 'beginner',
    category: 'stretch',
    durationSeconds: 30,
    cues: [
      {
        id: 'tuck_pelvis',
        text: 'Tuck your pelvis under — posteriorly tilt',
        joints: ['hips_pelvis'],
        correctionArrowDirection: 'inward',
      },
      {
        id: 'chest_up',
        text: 'Keep your chest tall — don\'t lean forward',
        joints: ['thoracic_spine'],
        correctionArrowDirection: 'up',
      },
      {
        id: 'drive_hips',
        text: 'Drive hips gently forward into the stretch',
        joints: ['hips_pelvis'],
        correctionArrowDirection: 'down',
      },
    ],
    thresholds: [
      { metric: 'pelvicTiltAngle', greenMin: -5, greenMax: 5, yellowMin: 5, yellowMax: 15 },
      { metric: 'torsoLeanAngle', greenMin: -5, greenMax: 5, yellowMin: 5, yellowMax: 15 },
    ],
    setupInstructions: [
      'Kneel on your right knee, left foot forward (lunge position)',
      'Place a soft surface under your right knee if needed',
      'Keep your torso upright — don\'t lean forward',
      'Tuck your pelvis under (posterior tilt) before driving forward',
      'Hold the stretch in your right hip flexor',
    ],
    unsafeConditions: [
      'Sharp knee pain at kneeling knee',
      'Lower back spasm or severe tightening',
      'Hip impingement pain at front of hip',
    ],
    demoAsset: '/assets/drills/hip-flexor-stretch.webp',
  },
  {
    id: 'squat_alignment_drill',
    name: 'Squat Alignment Drill',
    shortName: 'Squat Drill',
    description:
      'Retrains knee tracking mechanics during the squat movement. Teaches knees to stay aligned over the mid-foot and prevent inward collapse (valgus).',
    targetIssues: ['knee_valgus'],
    primaryRegion: 'knees',
    affectedRegions: ['knees', 'hips_pelvis', 'ankles_feet'],
    position: 'standing',
    difficulty: 'beginner',
    category: 'mobility',
    durationSeconds: 60,
    reps: 10,
    cues: [
      {
        id: 'knees_out',
        text: 'Push knees outward — track over your pinky toe',
        joints: ['knees'],
        correctionArrowDirection: 'outward',
      },
      {
        id: 'chest_up',
        text: 'Keep chest lifted — don\'t collapse forward',
        joints: ['thoracic_spine'],
        correctionArrowDirection: 'up',
      },
      {
        id: 'weight_even',
        text: 'Distribute weight evenly across both feet',
        joints: ['ankles_feet'],
      },
    ],
    thresholds: [
      { metric: 'kneeValgusAngle', greenMin: -5, greenMax: 5, yellowMin: 5, yellowMax: 12 },
      { metric: 'torsoForwardLean', greenMin: 0, greenMax: 15, yellowMin: 15, yellowMax: 25 },
    ],
    setupInstructions: [
      'Stand facing the camera, feet shoulder-width apart',
      'Toes pointed slightly outward (15–30°)',
      'Perform a slow, controlled squat to parallel depth',
      'Focus on pushing your knees outward as you descend',
      'Pause at the bottom, then drive back up',
    ],
    unsafeConditions: [
      'Sharp or shooting knee pain',
      'Knee locking or giving way',
      'Significant knee collapse past safe threshold',
    ],
    demoAsset: '/assets/drills/squat-alignment.webp',
  },
  {
    id: 'split_squat_control',
    name: 'Split Squat Control Drill',
    shortName: 'Split Squat',
    description:
      'Builds single-leg stability and reduces left-right movement asymmetry. Trains each leg independently to correct loading imbalances.',
    targetIssues: ['lateral_asymmetry', 'knee_valgus'],
    primaryRegion: 'knees',
    affectedRegions: ['knees', 'hips_pelvis', 'ankles_feet'],
    position: 'standing',
    difficulty: 'intermediate',
    category: 'stability',
    durationSeconds: 60,
    reps: 8,
    sets: 2,
    cues: [
      {
        id: 'front_knee_track',
        text: 'Front knee tracks over your second toe',
        joints: ['knees'],
        correctionArrowDirection: 'outward',
      },
      {
        id: 'hips_level',
        text: 'Keep your hips level — don\'t let one hip drop',
        joints: ['hips_pelvis'],
      },
      {
        id: 'control_descent',
        text: 'Control the descent — no dropping down fast',
        joints: ['knees', 'hips_pelvis'],
        correctionArrowDirection: 'down',
      },
    ],
    thresholds: [
      { metric: 'frontKneeValgus', greenMin: -5, greenMax: 5, yellowMin: 5, yellowMax: 12 },
      { metric: 'hipLevelDifference', greenMin: 0, greenMax: 3, yellowMin: 3, yellowMax: 8 },
      { metric: 'descentSpeed', greenMin: 0, greenMax: 0.3, yellowMin: 0.3, yellowMax: 0.5 },
    ],
    setupInstructions: [
      'Stand facing the camera, feet hip-width apart',
      'Step one foot forward into a split stance',
      'Back heel raised, front foot flat on the floor',
      'Lower your back knee toward the floor slowly',
      'Keep front shin roughly vertical',
    ],
    unsafeConditions: [
      'Sharp front knee pain during descent',
      'Significant hip drop (Trendelenburg sign)',
      'Loss of balance requiring hand support',
    ],
    demoAsset: '/assets/drills/split-squat.webp',
  },
]

/** Quick lookup by ID */
export const getDrillById = (id: string): Drill | undefined =>
  DRILLS.find((d) => d.id === id)
