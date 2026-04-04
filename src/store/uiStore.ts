/**
 * UI store — global UI state: toasts, modals, feature flags, preferences.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  type: ToastType
  durationMs: number
}

interface UiState {
  // Toasts
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, durationMs?: number) => void
  removeToast: (id: string) => void

  // Disclaimer
  hasAcceptedDisclaimer: boolean
  acceptDisclaimer: () => void

  // Preferences (persisted)
  mirrorCamera: boolean
  toggleMirrorCamera: () => void
  showSkeletonOverlay: boolean
  toggleSkeletonOverlay: () => void
  showAlignmentLines: boolean
  toggleAlignmentLines: () => void
  audioFeedback: boolean
  toggleAudioFeedback: () => void

  // Feature flags (read from env, overridable for dev)
  flags: {
    enableMockPose: boolean
    enableSessionHistory: boolean
    enableAnalytics: boolean
  }
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      // Toasts
      toasts: [],
      addToast: (message, type = 'info', durationMs = 4000) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id: crypto.randomUUID(), message, type, durationMs },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Disclaimer
      hasAcceptedDisclaimer: false,
      acceptDisclaimer: () => set({ hasAcceptedDisclaimer: true }),

      // Preferences
      mirrorCamera: true,
      toggleMirrorCamera: () =>
        set((state) => ({ mirrorCamera: !state.mirrorCamera })),

      showSkeletonOverlay: true,
      toggleSkeletonOverlay: () =>
        set((state) => ({ showSkeletonOverlay: !state.showSkeletonOverlay })),

      showAlignmentLines: true,
      toggleAlignmentLines: () =>
        set((state) => ({ showAlignmentLines: !state.showAlignmentLines })),

      audioFeedback: true,
      toggleAudioFeedback: () =>
        set((state) => ({ audioFeedback: !state.audioFeedback })),

      // Feature flags from env
      flags: {
        enableMockPose: import.meta.env.VITE_ENABLE_MOCK_POSE === 'true',
        enableSessionHistory: import.meta.env.VITE_ENABLE_SESSION_HISTORY !== 'false',
        enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      },
    }),
    {
      name: 'strainsense-ui-prefs',
      // Only persist preferences, not transient UI state
      partialize: (state) => ({
        hasAcceptedDisclaimer: state.hasAcceptedDisclaimer,
        mirrorCamera: state.mirrorCamera,
        showSkeletonOverlay: state.showSkeletonOverlay,
        showAlignmentLines: state.showAlignmentLines,
        audioFeedback: state.audioFeedback,
      }),
    }
  )
)
