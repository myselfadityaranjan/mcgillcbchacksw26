// ──────────────────────────────────────────────────────────────
// PoseEngine — MediaPipe Pose Landmarker wrapper
// ──────────────────────────────────────────────────────────────

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark, WorldLandmark } from '../types/pose';

// ── Public types ─────────────────────────────────────────────

export interface PoseDetectionResult {
  normalizedLandmarks: NormalizedLandmark[];
  worldLandmarks: WorldLandmark[];
}

export type ModelComplexity = 'lite' | 'full' | 'heavy';

export interface PoseEngineConfig {
  modelComplexity: ModelComplexity;
  minDetectionConfidence: number;
  minPresenceConfidence: number;
  minTrackingConfidence: number;
}

// ── Constants ────────────────────────────────────────────────

const MODEL_URLS: Record<ModelComplexity, string> = {
  lite: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
  full: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
  heavy: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
};

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';

const DEFAULT_CONFIG: PoseEngineConfig = {
  modelComplexity: 'full',
  minDetectionConfidence: 0.5,
  minPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

// ── Engine class ─────────────────────────────────────────────

export class PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private config: PoseEngineConfig;
  private lastTimestamp = -1;

  constructor(config: Partial<PoseEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Load the WASM runtime + model. Tries GPU delegate first, falls back to CPU. */
  async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

    const createOptions = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: {
        modelAssetPath: MODEL_URLS[this.config.modelComplexity],
        delegate,
      },
      runningMode: 'VIDEO' as const,
      numPoses: 1,
      minPoseDetectionConfidence: this.config.minDetectionConfidence,
      minPosePresenceConfidence: this.config.minPresenceConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
    });

    try {
      this.landmarker = await PoseLandmarker.createFromOptions(vision, createOptions('GPU'));
    } catch {
      // GPU delegate may fail on some hardware — fall back to CPU
      this.landmarker = await PoseLandmarker.createFromOptions(vision, createOptions('CPU'));
    }
  }

  /**
   * Run pose detection on a video frame.
   * @param video  The <video> element currently playing the webcam feed.
   * @param timestamp  Monotonically increasing ms value (use performance.now()).
   * @returns Detection result, or null if no body was found.
   */
  detect(video: HTMLVideoElement, timestamp: number): PoseDetectionResult | null {
    if (!this.landmarker) return null;

    // MediaPipe requires strictly increasing timestamps
    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = timestamp;

    const result = this.landmarker.detectForVideo(video, timestamp);

    if (!result.landmarks.length) return null;

    // Convert from MediaPipe's types to our decoupled types
    const raw = result.landmarks[0]!;
    const rawWorld = result.worldLandmarks[0]!;

    return {
      normalizedLandmarks: raw.map((l) => ({
        x: l.x,
        y: l.y,
        z: l.z,
        visibility: l.visibility ?? 0,
      })),
      worldLandmarks: rawWorld.map((l) => ({
        x: l.x,
        y: l.y,
        z: l.z,
        visibility: l.visibility ?? 0,
      })),
    };
  }

  isReady(): boolean {
    return this.landmarker !== null;
  }

  /** Release all resources. */
  destroy(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
