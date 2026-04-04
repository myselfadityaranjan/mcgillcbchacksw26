// ──────────────────────────────────────────────────────────────
// drillVideos.ts — maps drill IDs to demo video paths
// Videos are silent MP4 loops stored in public/videos/
// ──────────────────────────────────────────────────────────────

import type { DrillId } from '../types/plan';

/** Drills that have a recorded video demonstration */
export const DRILL_VIDEOS: Partial<Record<DrillId, string>> = {
  'chin-tuck-exercise':    '/videos/chin-tuck.mp4',
  'squat-alignment-drill': '/videos/squat-alignment.mp4',
  'wall-angel':            '/videos/wall-angel.mp4',
};

/** IDs of drills that have video demos */
export const VIDEO_DRILL_IDS: DrillId[] = [
  'chin-tuck-exercise',
  'squat-alignment-drill',
  'wall-angel',
];

export function getDrillVideo(drillId: string): string | null {
  return DRILL_VIDEOS[drillId as DrillId] ?? null;
}
