import { AppProvider, useApp } from './state/appContext';
import { useCamera } from './hooks/useCamera';
import { usePoseEngine } from './hooks/usePoseEngine';
import { Activity } from 'lucide-react';

import { LandingPage }     from './pages/LandingPage';
import { SetupPage }       from './pages/SetupPage';
import { AssessmentPage }  from './pages/AssessmentPage';
import { AnalyzingPage }   from './pages/AnalyzingPage';
import { ResultsPage }     from './pages/ResultsPage';
import { DrillDetailPage } from './pages/DrillDetailPage';
import { CoachingPage }    from './pages/CoachingPage';
import { CompletionPage }  from './pages/CompletionPage';

function InnerApp() {
  const { state, navigate } = useApp();
  const { videoRef, isActive, error: camErr, start: startCam } = useCamera();
  const { isLoaded, isLoading, error: modelErr, detect }        = usePoseEngine();

  const showHeader = state.screen !== 'landing' && state.screen !== 'coaching';

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {showHeader && (
        <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b border-border bg-white/70 backdrop-blur-sm">
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
          >
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-[0_0_0_1px_rgba(107,158,119,0.30),0_4px_12px_rgba(107,158,119,0.15)]">
              <Activity size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-text-1 tracking-tight text-sm">StrainSense</span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-breathe" />
            <span className="text-[11px] text-text-3 font-medium">Privacy first</span>
          </div>
        </header>
      )}

      <main className="flex-1">
        {state.screen === 'landing' && <LandingPage />}

        {state.screen === 'setup' && (
          <SetupPage
            videoRef={videoRef}
            isActive={isActive}
            isLoading={isLoading}
            isLoaded={isLoaded}
            camErr={camErr}
            modelErr={modelErr}
            startCam={startCam}
            onReady={() => navigate('assessment')}
          />
        )}

        {state.screen === 'assessment' && (
          <AssessmentPage videoRef={videoRef} detect={detect} />
        )}

        {state.screen === 'analyzing'    && <AnalyzingPage />}
        {state.screen === 'results'      && <ResultsPage />}
        {state.screen === 'drill-detail' && <DrillDetailPage />}

        {state.screen === 'coaching' && (
          <CoachingPage videoRef={videoRef} detect={detect} />
        )}

        {state.screen === 'completion' && <CompletionPage />}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <InnerApp />
    </AppProvider>
  );
}
