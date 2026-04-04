// ──────────────────────────────────────────────────────────────
// SetupPage — camera permission + model loading gate
// ──────────────────────────────────────────────────────────────

import { useApp } from '../state/appContext';

interface SetupPageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  camErr: string | null;
  modelErr: string | null;
  startCam: () => void;
  onReady: () => void;
}

export function SetupPage({
  videoRef,
  isActive,
  isLoading,
  isLoaded,
  camErr,
  modelErr,
  startCam,
  onReady,
}: SetupPageProps) {
  const { navigate } = useApp();
  const bothReady = isActive && isLoaded;

  return (
    <div className="page setup-page">
      <div className="setup-header">
        <button className="btn ghost btn-back" onClick={() => navigate('landing')}>
          ← Back
        </button>
        <h2>Camera Setup</h2>
      </div>

      {/* Hidden video — keeps the stream attached to this element until the
           AssessmentPage mounts and useCamera re-attaches to the new element */}
      <video ref={videoRef} playsInline muted className="setup-preview" />

      {(camErr ?? modelErr) && (
        <div className="banner error">{camErr ?? modelErr}</div>
      )}

      <div className="setup-checklist">
        <div className={`check-item ${isActive ? 'done' : ''}`}>
          <span className="check-dot" />
          <div>
            <strong>Camera access</strong>
            <p>{isActive ? 'Camera active' : 'Not yet granted'}</p>
          </div>
        </div>
        <div className={`check-item ${isLoaded ? 'done' : isLoading ? 'loading' : ''}`}>
          <span className="check-dot" />
          <div>
            <strong>Pose model</strong>
            <p>
              {isLoaded
                ? 'Ready'
                : isLoading
                  ? 'Loading…'
                  : 'Waiting for camera'}
            </p>
          </div>
        </div>
      </div>

      <div className="setup-tips">
        <h3>Before you begin</h3>
        <ul>
          <li>Stand 6–8 feet from the camera so your full body fits in frame</li>
          <li>Ensure the room is well lit — avoid backlighting</li>
          <li>Wear fitted clothing so your body shape is visible</li>
          <li>Clear space around you for the squat and balance steps</li>
        </ul>
      </div>

      {!isActive ? (
        <button className="btn primary btn-lg" onClick={startCam}>
          Enable Camera
        </button>
      ) : bothReady ? (
        <button className="btn primary btn-lg" onClick={onReady}>
          Begin Assessment →
        </button>
      ) : (
        <button className="btn primary btn-lg" disabled>
          {isLoading ? 'Loading model…' : 'Waiting…'}
        </button>
      )}
    </div>
  );
}
