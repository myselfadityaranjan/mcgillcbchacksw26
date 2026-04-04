// ──────────────────────────────────────────────────────────────
// CameraManager — webcam lifecycle, permissions, stream control
// ──────────────────────────────────────────────────────────────

export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
  frameRate: number;
}

const DEFAULT_CONFIG: CameraConfig = {
  width: 1280,
  height: 720,
  facingMode: 'user',
  frameRate: 30,
};

export class CameraManager {
  private stream: MediaStream | null = null;
  private config: CameraConfig;

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Request camera permission and attach the stream to a <video> element. */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    // Stop any existing stream first
    this.stop();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: this.config.width },
        height: { ideal: this.config.height },
        facingMode: this.config.facingMode,
        frameRate: { ideal: this.config.frameRate },
      },
      audio: false,
    });

    this.stream = stream;
    videoElement.srcObject = stream;

    // Wait for the video to be ready to play
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        videoElement.play().then(resolve).catch(reject);
      };
      const onError = () => {
        cleanup();
        reject(new Error('Video element failed to load stream'));
      };
      const cleanup = () => {
        videoElement.removeEventListener('loadedmetadata', onReady);
        videoElement.removeEventListener('error', onError);
      };
      videoElement.addEventListener('loadedmetadata', onReady);
      videoElement.addEventListener('error', onError);
    });
  }

  /** Stop all tracks and release the camera. */
  stop(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
  }

  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  /** Actual video resolution (may differ from requested). */
  getResolution(videoElement: HTMLVideoElement): { width: number; height: number } {
    return {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
    };
  }
}
