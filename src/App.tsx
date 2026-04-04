// ──────────────────────────────────────────────────────────────
// App.tsx — router shell.
//
// Camera and pose-engine instances are created once here and
// shared across pages. useCamera re-attaches the stream whenever
// the video element re-mounts after a page transition.
// ──────────────────────────────────────────────────────────────

import { AppProvider, useApp } from './state/appContext';
import { useCamera } from './hooks/useCamera';
import { usePoseEngine } from './hooks/usePoseEngine';

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

  return (
    <div className="app-shell">
      {state.screen !== 'landing' && (
        <header className="app-header">
          <button className="brand" onClick={() => navigate('landing')}>
            StrainSense
          </button>
        </header>
      )}

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
