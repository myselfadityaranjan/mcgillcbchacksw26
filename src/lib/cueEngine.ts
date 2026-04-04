// ──────────────────────────────────────────────────────────────
// cueEngine.ts — map metric violations to user-facing cues (Task 4)
// ──────────────────────────────────────────────────────────────

import type { LiveCue, CuePriority } from '../types/coaching';
import type { DrillId } from '../types/plan';
import { LM } from './landmarks';

type CueRule = {
  metric: string;
  priority: CuePriority;
  text: string;
  affectedLandmarks?: number[];
  arrows?: Array<{ fromLandmark: number; dx: number; dy: number }>;
};

const DRILL_CUES: Record<DrillId, CueRule[]> = {
  'doorway-pec-stretch': [
    {
      metric: 'headForward',
      priority: 'major',
      text: 'Tuck your chin — pull the head back so ears are over shoulders',
      affectedLandmarks: [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR],
      arrows: [{ fromLandmark: LM.NOSE, dx: 0, dy: -0.08 }],
    },
    {
      metric: 'shoulderSymmetry',
      priority: 'fine',
      text: 'Level your shoulders — keep them even left to right',
      affectedLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    },
    {
      metric: 'headTilt',
      priority: 'fine',
      text: 'Centre your head — keep the crown pointing straight up',
      affectedLandmarks: [LM.NOSE],
    },
  ],

  'wall-angel': [
    {
      metric: 'armLowness',
      priority: 'major',
      text: 'Raise your arms higher — wrists should reach above shoulder level',
      affectedLandmarks: [LM.LEFT_WRIST, LM.RIGHT_WRIST],
      arrows: [
        { fromLandmark: LM.LEFT_WRIST,  dx: 0, dy: -0.1 },
        { fromLandmark: LM.RIGHT_WRIST, dx: 0, dy: -0.1 },
      ],
    },
    {
      metric: 'elbowSymmetry',
      priority: 'major',
      text: 'Keep both elbows at the same height',
      affectedLandmarks: [LM.LEFT_ELBOW, LM.RIGHT_ELBOW],
    },
    {
      metric: 'headDrift',
      priority: 'major',
      text: 'Press your head back against the wall — do not let it drift forward',
      affectedLandmarks: [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR],
      arrows: [{ fromLandmark: LM.NOSE, dx: 0, dy: -0.08 }],
    },
    {
      metric: 'armSymmetry',
      priority: 'fine',
      text: 'Match wrist heights — raise the lower arm to meet the other',
      affectedLandmarks: [LM.LEFT_WRIST, LM.RIGHT_WRIST],
    },
  ],

  'hip-flexor-stretch': [
    {
      metric: 'torsoLean',
      priority: 'unsafe',
      text: 'Stop — bring your torso upright, do not lean forward',
      affectedLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP],
      arrows: [
        { fromLandmark: LM.LEFT_SHOULDER,  dx: 0, dy: -0.1 },
        { fromLandmark: LM.RIGHT_SHOULDER, dx: 0, dy: -0.1 },
      ],
    },
    {
      metric: 'shoulderSymmetry',
      priority: 'fine',
      text: 'Square your shoulders — keep them level, do not rotate',
      affectedLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    },
    {
      metric: 'kneeDropDepth',
      priority: 'major',
      text: 'Drop your back knee lower — sink deeper into the stretch',
      affectedLandmarks: [LM.LEFT_KNEE, LM.LEFT_HIP],
      arrows: [{ fromLandmark: LM.LEFT_KNEE, dx: 0, dy: 0.1 }],
    },
  ],

  'squat-alignment-drill': [
    {
      metric: 'leftValgus',
      priority: 'unsafe',
      text: 'Left knee collapsing — push the left knee outward over your toes',
      affectedLandmarks: [LM.LEFT_KNEE, LM.LEFT_HIP, LM.LEFT_ANKLE],
      arrows: [{ fromLandmark: LM.LEFT_KNEE, dx: -0.1, dy: 0 }],
    },
    {
      metric: 'rightValgus',
      priority: 'unsafe',
      text: 'Right knee collapsing — push the right knee outward over your toes',
      affectedLandmarks: [LM.RIGHT_KNEE, LM.RIGHT_HIP, LM.RIGHT_ANKLE],
      arrows: [{ fromLandmark: LM.RIGHT_KNEE, dx: 0.1, dy: 0 }],
    },
    {
      metric: 'torsoForward',
      priority: 'major',
      text: 'Chest up — keep your torso more upright',
      affectedLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
      arrows: [
        { fromLandmark: LM.LEFT_SHOULDER,  dx: 0, dy: -0.08 },
        { fromLandmark: LM.RIGHT_SHOULDER, dx: 0, dy: -0.08 },
      ],
    },
  ],

  'split-squat-drill': [
    {
      metric: 'rightValgus',
      priority: 'unsafe',
      text: 'Front knee caving in — drive it outward over the 2nd toe',
      affectedLandmarks: [LM.RIGHT_KNEE, LM.RIGHT_HIP, LM.RIGHT_ANKLE],
      arrows: [{ fromLandmark: LM.RIGHT_KNEE, dx: 0.1, dy: 0 }],
    },
    {
      metric: 'leftValgus',
      priority: 'unsafe',
      text: 'Back knee caving in — push it outward to stay aligned',
      affectedLandmarks: [LM.LEFT_KNEE],
      arrows: [{ fromLandmark: LM.LEFT_KNEE, dx: -0.1, dy: 0 }],
    },
    {
      metric: 'torsoLean',
      priority: 'major',
      text: 'Torso leaning — stand tall, shoulders directly over hips',
      affectedLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
      arrows: [
        { fromLandmark: LM.LEFT_SHOULDER,  dx: 0, dy: -0.08 },
        { fromLandmark: LM.RIGHT_SHOULDER, dx: 0, dy: -0.08 },
      ],
    },
    {
      metric: 'shoulderSymmetry',
      priority: 'fine',
      text: 'Level your shoulders — do not dip one side',
      affectedLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    },
  ],
};

// ── Priority ordering ─────────────────────────────────────────

const PRIORITY_ORDER: Record<CuePriority, number> = {
  unsafe: 0,
  major: 1,
  fine: 2,
};

/**
 * Select the highest-priority cue for metrics that exceed their red threshold.
 * Pass `redMetrics` as the set of metric names currently in the red state.
 */
export function selectCue(
  drillId: DrillId,
  redMetrics: string[],
  yellowMetrics: string[],
): LiveCue | null {
  const rules = DRILL_CUES[drillId];
  if (!rules) return null;

  // First pass: look for red violations
  const redRules = rules
    .filter((r) => redMetrics.includes(r.metric))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  if (redRules.length > 0) {
    const rule = redRules[0]!;
    return {
      text: rule.text,
      priority: rule.priority,
      affectedLandmarks: rule.affectedLandmarks,
      arrows: rule.arrows,
    };
  }

  // Second pass: yellow violations
  const yellowRules = rules
    .filter((r) => yellowMetrics.includes(r.metric))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  if (yellowRules.length > 0) {
    const rule = yellowRules[0]!;
    return {
      text: rule.text,
      priority: rule.priority,
      affectedLandmarks: rule.affectedLandmarks,
      arrows: rule.arrows,
    };
  }

  return null;
}
