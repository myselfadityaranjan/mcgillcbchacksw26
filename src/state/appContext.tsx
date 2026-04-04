// ──────────────────────────────────────────────────────────────
// appContext.tsx — global app state managed via useReducer.
// Provides typed context consumed by all pages.
// ──────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { AssessmentResult } from '../types/pose';
import type { AnalysisResult } from '../types/analysis';
import type { CorrectionPlan, Drill } from '../types/plan';
import type { CoachingSession } from '../types/coaching';

// ── Screen enum ───────────────────────────────────────────────

export type Screen =
  | 'landing'
  | 'setup'
  | 'assessment'
  | 'analyzing'
  | 'results'
  | 'drill-detail'
  | 'coaching'
  | 'completion';

// ── App state ─────────────────────────────────────────────────

export interface AppState {
  screen: Screen;
  assessmentResult: AssessmentResult | null;
  analysis: AnalysisResult | null;
  plan: CorrectionPlan | null;
  selectedDrill: Drill | null;
  coachingSession: CoachingSession | null;
}

const INITIAL_STATE: AppState = {
  screen: 'landing',
  assessmentResult: null,
  analysis: null,
  plan: null,
  selectedDrill: null,
  coachingSession: null,
};

// ── Actions ───────────────────────────────────────────────────

type Action =
  | { type: 'GO_TO'; screen: Screen }
  | { type: 'ASSESSMENT_COMPLETE'; result: AssessmentResult }
  | { type: 'ANALYSIS_COMPLETE'; analysis: AnalysisResult; plan: CorrectionPlan }
  | { type: 'SELECT_DRILL'; drill: Drill }
  | { type: 'COACHING_COMPLETE'; session: CoachingSession }
  | { type: 'RESCAN' }
  | { type: 'RESET' };

// ── Reducer ───────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'GO_TO':
      return { ...state, screen: action.screen };

    case 'ASSESSMENT_COMPLETE':
      return {
        ...state,
        assessmentResult: action.result,
        screen: 'analyzing',
      };

    case 'ANALYSIS_COMPLETE':
      return {
        ...state,
        analysis: action.analysis,
        plan: action.plan,
        screen: 'results',
      };

    case 'SELECT_DRILL':
      return {
        ...state,
        selectedDrill: action.drill,
        screen: 'drill-detail',
      };

    case 'COACHING_COMPLETE':
      return {
        ...state,
        coachingSession: action.session,
        screen: 'completion',
      };

    case 'RESCAN':
      return {
        ...state,
        screen: 'assessment',
        assessmentResult: null,
        analysis: null,
        plan: null,
        selectedDrill: null,
      };

    case 'RESET':
      return INITIAL_STATE;

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  navigate: (screen: Screen) => void;
  completeAssessment: (result: AssessmentResult) => void;
  completeAnalysis: (analysis: AnalysisResult, plan: CorrectionPlan) => void;
  selectDrill: (drill: Drill) => void;
  completeCoaching: (session: CoachingSession) => void;
  rescan: () => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const navigate        = useCallback((screen: Screen)  => dispatch({ type: 'GO_TO', screen }),                                                          []);
  const completeAssessment = useCallback((result: AssessmentResult) => dispatch({ type: 'ASSESSMENT_COMPLETE', result }),                                 []);
  const completeAnalysis   = useCallback((analysis: AnalysisResult, plan: CorrectionPlan) => dispatch({ type: 'ANALYSIS_COMPLETE', analysis, plan }),    []);
  const selectDrill        = useCallback((drill: Drill) => dispatch({ type: 'SELECT_DRILL', drill }),                                                    []);
  const completeCoaching   = useCallback((session: CoachingSession) => dispatch({ type: 'COACHING_COMPLETE', session }),                                 []);
  const rescan             = useCallback(() => dispatch({ type: 'RESCAN' }),                                                                             []);
  const reset              = useCallback(() => dispatch({ type: 'RESET' }),                                                                              []);

  return (
    <AppContext.Provider
      value={{ state, navigate, completeAssessment, completeAnalysis, selectDrill, completeCoaching, rescan, reset }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
