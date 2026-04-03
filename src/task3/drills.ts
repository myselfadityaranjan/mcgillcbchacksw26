// ============================================================================
// StrainSense — Task 3: Drill Library
// Single source of truth for all drill metadata.
// Consumed by: recommendationEngine.ts, planBuilder.ts, Task 4 (liveCoach),
//              Task 5 (DrillPage), Task 6 (overlay targeting).
// ============================================================================

import type {
  DrillId,
  DrillMetadata,
  IssueType,
} from "../types";

// ─── Internal drill definitions ─────────────────────────────────────────────

const DOORWAY_PEC_STRETCH: DrillMetadata = {
  id: "doorway_pec_stretch",
  displayName: "Doorway Pec Stretch",
  targetIssues: ["rounded_shoulders"],
  primaryBodyArea: "shoulders",
  secondaryBodyAreas: ["upper_back"],
  requiredPosition: "standing",
  shortDescription:
    "Stand in a doorway, place both forearms on the frame at 90°, and gently lean " +
    "forward until you feel a stretch across your chest and the front of your shoulders. " +
    "Hold and breathe.",
  whyItHelps:
    "The doorway pec stretch lengthens the pectoralis major and minor — the muscles " +
    "that pull the shoulders into protraction. Releasing their chronic shortness creates " +
    "space for the shoulder blades to retract and sit correctly on the ribcage.",
  demoAssetPath: "/assets/drills/doorway_pec_stretch.gif",
  coachingCues: [
    {
      priority: "unsafe",
      text: "Stop — pain in the shoulder joint. Reduce the angle.",
      targetArea: "shoulders",
    },
    {
      priority: "major_correction",
      text: "Keep your elbows at shoulder height, not above.",
      targetArea: "shoulders",
    },
    {
      priority: "major_correction",
      text: "Brace your core — avoid arching the lower back.",
      targetArea: "lower_back",
    },
    {
      priority: "fine_adjustment",
      text: "Breathe out and let the chest open a little more.",
      targetArea: "upper_back",
    },
  ],
  unsafeConditions: [
    {
      description:
        "Torso leans so far forward that the lower back hyperextends noticeably.",
      affectedArea: "lower_back",
    },
    {
      description: "Shoulders elevate toward ears — indicating impingement risk.",
      affectedArea: "shoulders",
    },
  ],
  durationSeconds: 30,
};

const WALL_ANGEL: DrillMetadata = {
  id: "wall_angel",
  displayName: "Wall Angel",
  targetIssues: ["rounded_shoulders", "forward_head_posture"],
  primaryBodyArea: "upper_back",
  secondaryBodyAreas: ["shoulders", "neck"],
  requiredPosition: "wall_supported",
  shortDescription:
    "Stand with your back flat against a wall, feet 15 cm out. Press your lower " +
    "back, shoulders, and head into the wall. Slide your arms up and down in a " +
    '"snow-angel" motion while maintaining all contact points.',
  whyItHelps:
    "Wall angels retrain thoracic extension and scapular upward rotation simultaneously. " +
    "The wall provides tactile feedback that prevents the chest from collapsing and the " +
    "head from drifting forward, directly addressing both rounded shoulders and forward " +
    "head posture in a single movement.",
  demoAssetPath: "/assets/drills/wall_angel.gif",
  coachingCues: [
    {
      priority: "unsafe",
      text: "Stop — head has left the wall. Reset before continuing.",
      targetArea: "neck",
    },
    {
      priority: "major_correction",
      text: "Press your lower back into the wall — close the gap.",
      targetArea: "lower_back",
    },
    {
      priority: "major_correction",
      text: "Keep both wrists in contact with the wall throughout.",
      targetArea: "shoulders",
    },
    {
      priority: "fine_adjustment",
      text: "Slide arms higher — full range only if contact is maintained.",
      targetArea: "upper_back",
    },
    {
      priority: "fine_adjustment",
      text: "Gently tuck the chin — keep the back of the head on the wall.",
      targetArea: "neck",
    },
  ],
  unsafeConditions: [
    {
      description:
        "Head loses contact with the wall, indicating cervical hyperextension.",
      affectedArea: "neck",
    },
    {
      description:
        "Lower back arches aggressively off the wall — lumbar compression risk.",
      affectedArea: "lower_back",
    },
  ],
  durationSeconds: 45,
  reps: 10,
};

const HIP_FLEXOR_STRETCH: DrillMetadata = {
  id: "hip_flexor_stretch",
  displayName: "Half-Kneeling Hip Flexor Stretch",
  targetIssues: ["apt_tendency"],
  primaryBodyArea: "hips",
  secondaryBodyAreas: ["pelvis", "lower_back"],
  requiredPosition: "half_kneeling",
  shortDescription:
    "Kneel with one knee down and the opposite foot forward. Squeeze the glute of " +
    "the back leg and tuck the pelvis slightly (posterior tilt) before shifting " +
    "your hips forward to feel the stretch in the front of the back hip. Hold, then switch sides.",
  whyItHelps:
    "In an anterior pelvic tilt pattern, the hip flexors — primarily the iliopsoas — " +
    "are chronically shortened and pull the pelvis into forward tilt. This stretch " +
    "targets the iliopsoas directly. The glute squeeze and posterior tilt cue ensure " +
    "the stretch reaches the muscle rather than just hinging from the lumbar spine.",
  demoAssetPath: "/assets/drills/hip_flexor_stretch.gif",
  coachingCues: [
    {
      priority: "unsafe",
      text: "Stop — sharp pain in the knee. Pad the floor or stop the drill.",
      targetArea: "knees",
    },
    {
      priority: "major_correction",
      text: "Squeeze the glute of your back leg before leaning forward.",
      targetArea: "hips",
    },
    {
      priority: "major_correction",
      text: "Tuck your pelvis — ribs down, avoid flaring the lower back.",
      targetArea: "pelvis",
    },
    {
      priority: "major_correction",
      text: "Keep your torso upright — do not lean forward at the waist.",
      targetArea: "lower_back",
    },
    {
      priority: "fine_adjustment",
      text: "Breathe out and gently increase the forward shift of the hips.",
      targetArea: "hips",
    },
  ],
  unsafeConditions: [
    {
      description:
        "Excessive lumbar extension — pelvis untucks and lower back hyperextends.",
      affectedArea: "lower_back",
    },
    {
      description:
        "Front knee tracks far past the toes under load, increasing patellofemoral stress.",
      affectedArea: "knees",
    },
  ],
  durationSeconds: 30, // per side
};

const SQUAT_ALIGNMENT_DRILL: DrillMetadata = {
  id: "squat_alignment_drill",
  displayName: "Squat Alignment Drill",
  targetIssues: ["knee_valgus"],
  primaryBodyArea: "knees",
  secondaryBodyAreas: ["hips", "ankles"],
  requiredPosition: "standing",
  shortDescription:
    "Perform a slow bodyweight squat, consciously driving both knees outward " +
    "in line with your second and third toes throughout the descent and ascent. " +
    "Pause at the bottom and check your knee position before standing.",
  whyItHelps:
    "Knee valgus during squatting typically stems from weak hip abductors and external " +
    "rotators. This drill trains the neuromuscular cue — actively pushing the knees out — " +
    "while the slow tempo provides enough time to detect and correct the collapse pattern " +
    "before it becomes habitual.",
  demoAssetPath: "/assets/drills/squat_alignment_drill.gif",
  coachingCues: [
    {
      priority: "unsafe",
      text: "Stop — knees collapsing inward significantly. Reset and restart.",
      targetArea: "knees",
    },
    {
      priority: "major_correction",
      text: "Push your knees outward — track them over your second toe.",
      targetArea: "knees",
    },
    {
      priority: "major_correction",
      text: "Keep your chest up — avoid caving forward at the torso.",
      targetArea: "upper_back",
    },
    {
      priority: "major_correction",
      text: "Shift weight back — heels should stay flat on the floor.",
      targetArea: "ankles",
    },
    {
      priority: "fine_adjustment",
      text: "Slow down — take 3 seconds to lower, 3 seconds to rise.",
      targetArea: "knees",
    },
    {
      priority: "fine_adjustment",
      text: "Brace your core throughout the movement.",
      targetArea: "core",
    },
  ],
  unsafeConditions: [
    {
      description:
        "Knee valgus angle exceeds ~20° inward from the hip-to-foot line.",
      affectedArea: "knees",
    },
    {
      description:
        "Heels lift off the floor, indicating ankle restriction driving the valgus.",
      affectedArea: "ankles",
    },
  ],
  durationSeconds: 60,
  reps: 10,
};

const SPLIT_SQUAT_DRILL: DrillMetadata = {
  id: "split_squat_drill",
  displayName: "Split Squat Control Drill",
  targetIssues: ["knee_valgus", "left_right_asymmetry"],
  primaryBodyArea: "knees",
  secondaryBodyAreas: ["hips", "core"],
  requiredPosition: "half_kneeling",
  shortDescription:
    "From a split stance, lower your back knee toward the floor while keeping " +
    "the front knee tracked over your second toe. Perform all reps on one side " +
    "before switching, focusing on alignment quality over speed.",
  whyItHelps:
    "The split squat isolates each leg independently, making left-right loading " +
    "imbalances immediately visible and addressable. The unilateral load exposes " +
    "the weaker or less stable side that bilateral squats can mask. It also trains " +
    "knee valgus correction under a realistic partial load.",
  demoAssetPath: "/assets/drills/split_squat_drill.gif",
  coachingCues: [
    {
      priority: "unsafe",
      text: "Stop — front knee collapsing inward. Reset your stance.",
      targetArea: "knees",
    },
    {
      priority: "major_correction",
      text: "Drive the front knee out — track it over your second toe.",
      targetArea: "knees",
    },
    {
      priority: "major_correction",
      text: "Keep your torso upright — do not lean excessively forward.",
      targetArea: "upper_back",
    },
    {
      priority: "major_correction",
      text: "Square your hips to the front — both hip bones should face forward.",
      targetArea: "hips",
    },
    {
      priority: "fine_adjustment",
      text: "Brace your core throughout and keep breathing steadily.",
      targetArea: "core",
    },
    {
      priority: "fine_adjustment",
      text: "Control the descent — 2–3 seconds down, pause, then rise.",
      targetArea: "knees",
    },
  ],
  unsafeConditions: [
    {
      description:
        "Front knee collapses inward past the midline of the foot.",
      affectedArea: "knees",
    },
    {
      description:
        "Torso leans so far forward that lumbar flexion under load is visible.",
      affectedArea: "lower_back",
    },
  ],
  durationSeconds: 60,
  reps: 8, // per side
};

// ─── Drill Library Map ───────────────────────────────────────────────────────

/**
 * The complete drill library as a readonly Map for O(1) lookup.
 * This is the single definition used everywhere in the codebase.
 */
export const DRILL_LIBRARY: ReadonlyMap<DrillId, DrillMetadata> = new Map<
  DrillId,
  DrillMetadata
>([
  ["doorway_pec_stretch", DOORWAY_PEC_STRETCH],
  ["wall_angel", WALL_ANGEL],
  ["hip_flexor_stretch", HIP_FLEXOR_STRETCH],
  ["squat_alignment_drill", SQUAT_ALIGNMENT_DRILL],
  ["split_squat_drill", SPLIT_SQUAT_DRILL],
]);

// ─── Lookup Utilities ────────────────────────────────────────────────────────

/**
 * Returns the DrillMetadata for a given DrillId.
 * Throws if the id is not in the library — this should never happen in practice
 * since DrillId is a closed union, but guards against future inconsistencies.
 */
export function getDrill(id: DrillId): DrillMetadata {
  const drill = DRILL_LIBRARY.get(id);
  if (!drill) {
    throw new Error(
      `[StrainSense] getDrill: unknown DrillId "${id}". ` +
        "Ensure the DrillId union and DRILL_LIBRARY are kept in sync."
    );
  }
  return drill;
}

/**
 * Returns all drills as an ordered array.
 * Order is consistent with DRILL_LIBRARY insertion order.
 */
export function getAllDrills(): DrillMetadata[] {
  return Array.from(DRILL_LIBRARY.values());
}

/**
 * Returns all drills that target a specific issue type as their primary concern.
 * A drill is included if issueType appears in its targetIssues array.
 */
export function getDrillsForIssue(issueType: IssueType): DrillMetadata[] {
  return getAllDrills().filter((drill) =>
    drill.targetIssues.includes(issueType)
  );
}
