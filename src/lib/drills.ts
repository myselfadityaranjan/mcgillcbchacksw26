// ──────────────────────────────────────────────────────────────
// drills.ts — authoritative drill library (Task 3)
// ──────────────────────────────────────────────────────────────

import type { Drill } from '../types/plan';
import { LM } from './landmarks';

export const DRILLS: Record<string, Drill> = {
  'doorway-pec-stretch': {
    id: 'doorway-pec-stretch',
    name: 'Doorway Pec Stretch',
    targetIssues: ['rounded-shoulders'],
    bodyArea: 'Chest & Shoulders',
    description: 'Opens the chest and lengthens the pectoral muscles to draw the shoulders back into neutral alignment.',
    setupInstructions: 'Stand in a doorway. Place both forearms against the door frame at shoulder height, elbows at 90°. Step one foot forward until you feel a stretch across your chest. Face the camera so your front is visible.',
    coachingCues: [
      'Keep your chin tucked — ears directly over shoulders',
      'Squeeze your shoulder blades together gently',
      'Do not arch your lower back — keep core lightly engaged',
      'Breathe slowly and allow the chest to open with each exhale',
    ],
    durationSeconds: 30,
    reps: 2,
    unsafeConditions: [
      'Sharp pain in shoulder joint',
      'Numbness or tingling down the arm',
    ],
    keyLandmarks: [
      LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
      LM.LEFT_ELBOW, LM.RIGHT_ELBOW,
      LM.LEFT_WRIST, LM.RIGHT_WRIST,
      LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR,
    ],
  },

  'wall-angel': {
    id: 'wall-angel',
    name: 'Wall Angel',
    targetIssues: ['rounded-shoulders', 'forward-head-posture'],
    bodyArea: 'Upper Back, Neck & Shoulders',
    description: 'Restores thoracic extension and scapular retraction while cuing cervical neutral — the cornerstone drill for upper-body posture.',
    setupInstructions: 'Stand with your back flat against a wall, feet 15 cm away. Press your lower back, upper back, and head against the wall. Raise arms to a W shape with elbows and wrists touching the wall. Face the camera.',
    coachingCues: [
      'Press the back of your head against the wall throughout',
      'Keep both elbows and wrists in contact with the wall',
      'Slide arms slowly up to a Y shape, then back to W',
      'Do not let your lower back peel off the wall',
    ],
    durationSeconds: 45,
    reps: 10,
    unsafeConditions: [
      'Sharp pain in shoulder on raising arms',
      'Inability to keep head against wall without strain',
    ],
    keyLandmarks: [
      LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR,
      LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
      LM.LEFT_ELBOW, LM.RIGHT_ELBOW,
      LM.LEFT_WRIST, LM.RIGHT_WRIST,
    ],
  },

  'hip-flexor-stretch': {
    id: 'hip-flexor-stretch',
    name: 'Hip Flexor Stretch',
    targetIssues: ['anterior-pelvic-tilt'],
    bodyArea: 'Hip Flexors & Lumbar',
    description: 'Lengthens the iliopsoas and rectus femoris to reduce anterior pelvic tilt and restore neutral lumbar alignment.',
    setupInstructions: 'Kneel on your left knee with your right foot forward (kneeling lunge). Keep your torso upright. Shift hips forward slightly to feel a stretch in the left hip. Face the camera so your right side is visible.',
    coachingCues: [
      'Tuck your pelvis slightly — do not let your back arch',
      'Keep your chest tall and shoulders over hips',
      'Squeeze your left glute to deepen the hip extension',
      'Hold the position — no bouncing',
    ],
    durationSeconds: 30,
    reps: 3,
    unsafeConditions: [
      'Sharp pain in the lower back',
      'Knee pain on the kneeling leg',
    ],
    keyLandmarks: [
      LM.LEFT_HIP, LM.RIGHT_HIP,
      LM.LEFT_KNEE, LM.RIGHT_KNEE,
      LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
    ],
  },

  'squat-alignment-drill': {
    id: 'squat-alignment-drill',
    name: 'Squat Alignment Drill',
    targetIssues: ['knee-valgus', 'lateral-asymmetry'],
    bodyArea: 'Knees, Hips & Glutes',
    description: 'Grooves correct knee tracking over the toes during a squat pattern, training the glute medius to prevent valgus collapse.',
    setupInstructions: 'Stand with feet hip-width apart, toes slightly out. Place a resistance band just above the knees if available. Face the camera directly. Perform slow controlled squats, pushing knees outward.',
    coachingCues: [
      'Push your knees outward — track over the 2nd and 3rd toes',
      'Keep your weight through your heels and mid-foot',
      'Keep your chest up — do not round your back',
      'Lower until thighs are parallel to the floor or as deep as comfortable',
    ],
    durationSeconds: 40,
    reps: 10,
    unsafeConditions: [
      'Sharp pain inside the knee',
      'Knee collapsing inward past the foot during loading',
    ],
    keyLandmarks: [
      LM.LEFT_HIP, LM.RIGHT_HIP,
      LM.LEFT_KNEE, LM.RIGHT_KNEE,
      LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
    ],
  },

  'split-squat-drill': {
    id: 'split-squat-drill',
    name: 'Split Squat Control Drill',
    targetIssues: ['knee-valgus', 'lateral-asymmetry', 'anterior-pelvic-tilt'],
    bodyArea: 'Hips, Knees & Core',
    description: 'Trains single-leg stability, hip control, and frontal plane alignment — simultaneously addressing asymmetry and knee collapse patterns.',
    setupInstructions: 'Stand in a split stance: right foot forward, left foot back, both feet facing forward. Lower slowly until the back knee hovers an inch from the floor. Keep your torso upright. Face the camera. Alternate sides.',
    coachingCues: [
      'Front knee stays directly over your ankle — do not let it drift inward',
      'Keep your torso vertical — do not lean forward',
      'Squeeze the glute of the back leg as you lower',
      'Lower with control — 3 seconds down, pause, 2 seconds up',
    ],
    durationSeconds: 50,
    reps: 8,
    unsafeConditions: [
      'Sharp pain in the front knee',
      'Front knee collapsing inward past the foot',
      'Balance failure requiring hands to catch',
    ],
    keyLandmarks: [
      LM.LEFT_HIP, LM.RIGHT_HIP,
      LM.LEFT_KNEE, LM.RIGHT_KNEE,
      LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
      LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
    ],
  },
  'chin-tuck-exercise': {
    id: 'chin-tuck-exercise',
    name: 'Chin Tuck',
    targetIssues: ['forward-head-posture', 'neck-flexion'],
    bodyArea: 'Neck & Cervical Spine',
    description: 'Retrains the deep cervical flexors to retract the head into neutral alignment, directly counteracting forward head and neck flexion posture.',
    setupInstructions: 'Sit or stand tall with your back straight. Face the camera. Place one finger lightly on your chin as a guide. Without nodding, gently draw your chin straight back — like making a double chin. Hold 3 seconds, release, repeat.',
    coachingCues: [
      'Draw chin straight back — not down, not tilted',
      'Keep your gaze level — eyes on the horizon throughout',
      'Feel the gentle stretch at the base of your skull',
      'Hold the retracted position for 3 full seconds before releasing',
    ],
    durationSeconds: 30,
    reps: 10,
    unsafeConditions: [
      'Sharp or shooting pain into the arm or hand',
      'Dizziness or lightheadedness when retracting',
    ],
    keyLandmarks: [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  },

  'cat-cow-stretch': {
    id: 'cat-cow-stretch',
    name: 'Cat–Cow Thoracic Mobilisation',
    targetIssues: ['thoracic-kyphosis', 'rounded-shoulders'],
    bodyArea: 'Thoracic Spine & Upper Back',
    description: 'Cycles the thoracic spine through full flexion and extension, reversing chronic kyphotic stiffness and restoring normal upper back mobility.',
    setupInstructions: 'Start on all fours: hands directly below shoulders, knees below hips. Keep arms straight throughout. Face sideways toward the camera so your spine is visible. Alternate between arching your back upward (cat) and dropping it downward (cow).',
    coachingCues: [
      'Cat: round your entire back toward the ceiling, tuck your chin and tailbone',
      'Cow: drop your belly down, lift your head and tailbone toward the ceiling',
      'Move slowly through each position — 3–4 seconds per phase',
      'Breathe in during cow (extension), breathe out during cat (flexion)',
    ],
    durationSeconds: 45,
    reps: 10,
    unsafeConditions: [
      'Sharp spinal pain during the cow (extension) phase',
      'Wrist pain — use fists or yoga blocks to reduce wrist load',
    ],
    keyLandmarks: [
      LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
      LM.LEFT_HIP,      LM.RIGHT_HIP,
      LM.NOSE,          LM.LEFT_EAR, LM.RIGHT_EAR,
    ],
  },
};

export const DRILL_LIST = Object.values(DRILLS);
