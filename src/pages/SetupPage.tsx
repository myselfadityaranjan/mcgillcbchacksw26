import { motion } from 'framer-motion';
import { Camera, Cpu, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { useApp } from '../state/appContext';
import { Button } from '../components/ui/Button';

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
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('landing')} leftIcon={<ChevronLeft size={14} />}>
        Back
      </Button>

      <div>
        <h2 className="text-2xl font-bold text-text-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Camera Setup
        </h2>
        <p className="text-text-2 text-sm mt-1">We need your camera and pose model ready before the scan.</p>
      </div>

      {/* Preview */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-elevated border border-border">
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-elevated">
            <Camera size={48} className="text-text-3" />
          </div>
        )}
      </div>

      {/* Error banners */}
      {(camErr ?? modelErr) && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-danger text-sm">
          {camErr ?? modelErr}
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-3">
        <CheckItem
          done={isActive}
          loading={false}
          icon={<Camera size={16} />}
          title="Camera access"
          sub={isActive ? 'Camera active' : 'Not yet granted'}
        />
        <CheckItem
          done={isLoaded}
          loading={isLoading}
          icon={<Cpu size={16} />}
          title="Pose model"
          sub={isLoaded ? 'Ready' : isLoading ? 'Loading...' : 'Waiting for camera'}
        />
      </div>

      {/* Tips */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-1 mb-3">Before you begin</h3>
        <ul className="space-y-2 text-sm text-text-2">
          <li className="flex gap-2"><span className="text-brand mt-0.5">•</span>Stand 6-8 feet from the camera so your full body fits in frame</li>
          <li className="flex gap-2"><span className="text-brand mt-0.5">•</span>Ensure the room is well lit — avoid backlighting</li>
          <li className="flex gap-2"><span className="text-brand mt-0.5">•</span>Wear fitted clothing so your body shape is visible</li>
          <li className="flex gap-2"><span className="text-brand mt-0.5">•</span>Clear space around you for the squat and balance steps</li>
        </ul>
      </div>

      {/* CTA */}
      {!isActive ? (
        <Button fullWidth size="lg" onClick={startCam} leftIcon={<Camera size={18} />}>
          Enable Camera
        </Button>
      ) : bothReady ? (
        <Button fullWidth size="lg" onClick={onReady}>
          Begin Assessment →
        </Button>
      ) : (
        <Button fullWidth size="lg" disabled isLoading={isLoading}>
          {isLoading ? 'Loading model...' : 'Waiting...'}
        </Button>
      )}
    </div>
  );
}

function CheckItem({ done, loading, icon, title, sub }: {
  done: boolean;
  loading: boolean;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
        done
          ? 'bg-success/5 border-success/20'
          : 'bg-surface border-border'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${done ? 'bg-success/15 text-success' : 'bg-elevated text-text-3'}`}>
        {done ? <Check size={16} /> : loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-text-1">{title}</p>
        <p className="text-xs text-text-3">{sub}</p>
      </div>
    </motion.div>
  );
}
