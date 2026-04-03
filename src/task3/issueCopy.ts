// ============================================================================
// StrainSense — Task 3: Issue Copy Layer
// Generates all user-facing text for IssueCards.
//
// Language rules (per spec §6):
//   ✓ "a pattern consistent with"   ✓ "tendency toward"
//   ✓ "may contribute to"           ✓ "suggested corrective focus"
//   ✗ "you have X"                  ✗ diagnostic claims
//   ✗ "will cause"                  ✗ medical certainty
//
// Consumed by: planBuilder.ts
// Exports for testing: ISSUE_COPY, all builder functions
// ============================================================================

import type {
  IssueType,
  Severity,
  DetectedIssue,
  IssueCard,
} from "../types";
import { getSupportingCuesForIssue } from "./recommendationEngine";

// ─── Static Copy Blocks ──────────────────────────────────────────────────────

/** The shape of the static copy record for each issue type. */
export interface IssueCopyBlock {
  /** Short display name shown in headlines and cards. */
  displayName: string;
  /** 1–2 sentence explanation of why this pattern matters for strain risk. */
  whyItMatters: string;
  /** Risk statement for mild severity. */
  mildRisk: string;
  /** Risk statement for moderate severity. */
  moderateRisk: string;
  /** Risk statement for severe severity. */
  severeRisk: string;
  /**
   * Bridge sentence from the issue to the corrective drills.
   * Should invite action, not alarm.
   */
  recommendedFocus: string;
}

/**
 * Static copy for all 5 issue types.
 * All copy uses non-diagnostic language throughout.
 * Exported for testing and potential i18n use.
 */
export const ISSUE_COPY: Readonly<Record<IssueType, IssueCopyBlock>> = {
  rounded_shoulders: {
    displayName: "Rounded Shoulders",
    whyItMatters:
      "A rounded shoulder pattern places ongoing load on the upper trapezius, " +
      "rhomboids, and rotator cuff, and may compress the thoracic outlet. Over " +
      "time, this posture tends to limit overhead range of motion and can cause " +
      "the neck and upper back to compensate with added effort.",
    mildRisk:
      "May contribute to occasional upper-back fatigue and gradually reduced " +
      "shoulder mobility if left unaddressed.",
    moderateRisk:
      "May contribute to recurring upper-back and neck tension, reduced " +
      "shoulder mobility, and increased load on the rotator cuff during " +
      "overhead activities.",
    severeRisk:
      "May contribute to persistent neck and shoulder strain, notably " +
      "restricted overhead range of motion, and increased susceptibility to " +
      "rotator cuff irritation.",
    recommendedFocus:
      "The suggested corrective focus is on opening the chest and retraining " +
      "scapular retraction to bring the shoulders back to a more neutral position.",
  },

  forward_head_posture: {
    displayName: "Forward Head Posture",
    whyItMatters:
      "A forward head tendency means the head sits anterior to the shoulder line. " +
      "For each centimetre of forward displacement, the effective load on the " +
      "cervical spine roughly doubles — placing sustained stress on the neck " +
      "muscles, discs, and joints even during rest.",
    mildRisk:
      "May contribute to occasional neck stiffness and mild upper-trapezius " +
      "tension, particularly after prolonged sitting.",
    moderateRisk:
      "May contribute to recurring cervical muscle fatigue, headache patterns " +
      "associated with neck tension, and reduced neck range of motion.",
    severeRisk:
      "May contribute to persistent cervical strain, frequent tension-related " +
      "headaches, and shoulder impingement risk due to altered thoracic posture.",
    recommendedFocus:
      "The suggested corrective focus is on thoracic extension and cervical " +
      "repositioning drills that retrain the head-over-shoulder alignment.",
  },

  apt_tendency: {
    displayName: "Anterior Pelvic Tilt Tendency",
    whyItMatters:
      "An anterior pelvic tilt tendency compresses the lumbar facet joints and " +
      "places the hip flexors in a chronically shortened position. It also " +
      "inhibits the glutes, which can affect movement quality across a wide " +
      "range of activities from walking to lifting.",
    mildRisk:
      "May contribute to occasional lower-back tightness and mild hip flexor " +
      "restriction over time.",
    moderateRisk:
      "May contribute to recurring lower-back discomfort, reduced hip extension " +
      "range of motion, and hamstring tightness as a downstream compensation.",
    severeRisk:
      "May contribute to persistent lumbar compression pain, significantly " +
      "restricted hip extension, and inhibited glute activation during " +
      "loaded movements.",
    recommendedFocus:
      "The suggested corrective focus is on restoring hip flexor length and " +
      "retraining pelvic neutral positioning to reduce the anterior tilt pattern.",
  },

  knee_valgus: {
    displayName: "Knee Valgus",
    whyItMatters:
      "An inward knee drift pattern during loaded movements concentrates stress " +
      "on the medial knee structures — including the MCL and medial meniscus — " +
      "and increases tension along the IT band. This pattern is often associated " +
      "with weak hip abductors and external rotators.",
    mildRisk:
      "May contribute to occasional medial knee discomfort during repetitive " +
      "loading activities such as running or stairs.",
    moderateRisk:
      "May contribute to recurring patellofemoral discomfort, IT band tightness, " +
      "and increased medial joint stress during dynamic activities.",
    severeRisk:
      "May contribute to persistent knee pain, elevated risk of medial knee " +
      "structure strain, and compensatory hip and ankle mechanics.",
    recommendedFocus:
      "The suggested corrective focus is on knee tracking alignment drills to " +
      "train the neuromuscular habit of keeping the knee over the foot during " +
      "squatting and single-leg movements.",
  },

  left_right_asymmetry: {
    displayName: "Left-Right Loading Imbalance",
    whyItMatters:
      "A persistent left-right loading asymmetry means one side of the body " +
      "consistently bears more load, causing it to compensate for the weaker " +
      "or less mobile side. Over time, this pattern tends to accelerate " +
      "cumulative strain on the overloaded structures while the underloaded " +
      "side loses strength and coordination.",
    mildRisk:
      "May contribute to gradually developing single-side muscle tightness " +
      "or minor loading asymmetry during everyday activity.",
    moderateRisk:
      "May contribute to noticeable single-side overuse patterns, uneven " +
      "hip and knee mechanics, and compensatory posture shifts.",
    severeRisk:
      "May contribute to significant single-side overuse strain, altered gait " +
      "mechanics, and increased risk of loading-related injury on the dominant side.",
    recommendedFocus:
      "The suggested corrective focus is on unilateral control drills that " +
      "expose and address the side-to-side difference directly.",
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Builds a complete IssueCard from a DetectedIssue.
 * This is the primary export — planBuilder.ts calls this for each issue.
 */
export function buildIssueCard(issue: DetectedIssue): IssueCard {
  return {
    issueType: issue.type,
    severity: issue.severity,
    headline: buildHeadline(issue.type, issue.severity),
    whatWasDetected: buildWhatWasDetected(issue),
    whyItMatters: buildWhyItMatters(issue.type),
    whatItMayContributeTo: buildRiskStatement(issue.type, issue.severity),
    recommendedFocus: buildRecommendedFocus(issue.type),
    affectedAreas: [...issue.affectedAreas], // copy to prevent mutation
    evidenceFrameDataUrl: issue.evidenceFrameDataUrl,
  };
}

/**
 * Generates the card headline.
 * e.g. "Rounded Shoulders — Moderate"
 */
export function buildHeadline(type: IssueType, severity: Severity): string {
  const displayName = ISSUE_COPY[type].displayName;
  const severityLabel =
    severity.charAt(0).toUpperCase() + severity.slice(1);
  return `${displayName} — ${severityLabel}`;
}

/**
 * Generates the "What was detected" paragraph.
 * Grounds the text in the evidenceSummary from Task 2 using non-diagnostic language.
 */
export function buildWhatWasDetected(issue: DetectedIssue): string {
  const displayName = ISSUE_COPY[issue.type].displayName.toLowerCase();

  // Use the Task 2 evidence summary as the measurement anchor.
  // If it's empty (shouldn't happen, but guard anyway), fall back to generic.
  const evidencePart =
    issue.evidenceSummary.trim().length > 0
      ? ` Specifically: ${issue.evidenceSummary.trim()}`
      : "";

  return (
    `During your movement assessment, a pattern consistent with ${displayName} was detected.${evidencePart} ` +
    `This finding has ${confidenceLabel(issue.confidence)} confidence based on the scan data.`
  );
}

/**
 * Returns the "Why it matters" paragraph for an issue type.
 */
export function buildWhyItMatters(type: IssueType): string {
  return ISSUE_COPY[type].whyItMatters;
}

/**
 * Generates the forward-looking risk statement appropriate for the detected severity.
 */
export function buildRiskStatement(type: IssueType, severity: Severity): string {
  const copy = ISSUE_COPY[type];
  switch (severity) {
    case "mild":
      return copy.mildRisk;
    case "moderate":
      return copy.moderateRisk;
    case "severe":
      return copy.severeRisk;
  }
}

/**
 * Generates the bridge sentence from issue to corrective drills.
 * Appends supporting (non-drill) cues if any are defined for this issue.
 */
export function buildRecommendedFocus(type: IssueType): string {
  const baseFocus = ISSUE_COPY[type].recommendedFocus;
  const supportingCues = getSupportingCuesForIssue(type);

  if (supportingCues.length === 0) {
    return baseFocus;
  }

  const cueText = supportingCues.join(" and ");
  return `${baseFocus} Additional corrective emphasis on ${cueText} may also help.`;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Converts a numeric confidence score [0–1] to a readable label.
 */
function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.6) return "moderate";
  return "lower"; // still above MIN_CONFIDENCE_THRESHOLD (0.4)
}
