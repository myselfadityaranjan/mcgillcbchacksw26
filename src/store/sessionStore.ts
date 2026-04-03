/**
 * Session store — persists completed sessions to localStorage.
 * The storage adapter is swappable: replace the localStorage calls
 * with API calls without any changes to this store's API.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StrainSession, SessionSummary, CompletedDrill } from '@/types'

interface SessionState {
  sessions: StrainSession[]
  activeSessionId: string | null

  // Actions
  createSession: (id: string) => void
  setActiveSession: (id: string) => void
  updateSession: (id: string, update: Partial<StrainSession>) => void
  addCompletedDrill: (sessionId: string, drill: CompletedDrill) => void
  finalizeSession: (id: string) => void
  getSummaries: () => SessionSummary[]
  getSession: (id: string) => StrainSession | undefined
  clearAll: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (id) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              id,
              startedAt: Date.now(),
              completedAt: null,
              analysis: null,
              plan: null,
              completedDrills: [],
              overallScore: null,
            },
          ],
          activeSessionId: id,
        })),

      setActiveSession: (id) => set({ activeSessionId: id }),

      updateSession: (id, update) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...update } : s
          ),
        })),

      addCompletedDrill: (sessionId, drill) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, completedDrills: [...s.completedDrills, drill] }
              : s
          ),
        })),

      finalizeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, completedAt: Date.now() } : s
          ),
          activeSessionId: null,
        })),

      getSummaries: () => {
        const { sessions } = get()
        return sessions
          .filter((s) => s.completedAt !== null)
          .map((s): SessionSummary => ({
            id: s.id,
            date: new Date(s.startedAt).toISOString(),
            overallScore: s.overallScore,
            issueCount: s.analysis?.issues.length ?? 0,
            drillsCompleted: s.completedDrills.length,
            durationMinutes: s.completedAt
              ? Math.round((s.completedAt - s.startedAt) / 60_000)
              : 0,
          }))
          .sort((a, b) => b.date.localeCompare(a.date))
      },

      getSession: (id) => get().sessions.find((s) => s.id === id),

      clearAll: () => set({ sessions: [], activeSessionId: null }),
    }),
    {
      name: 'strainsense-sessions',
      version: 1,
      // Future: migrate stored data on version bump
      migrate: (persistedState, version) => {
        if (version === 0) {
          // No migrations needed yet
        }
        return persistedState as SessionState
      },
    }
  )
)
