/**
 * useSpeechCue — reads coaching cues aloud using the Web Speech API.
 *
 * - Only speaks when audioFeedback is enabled in uiStore
 * - Debounces: won't re-speak the same cue text within 4 seconds
 * - Cancels previous utterance before speaking new one
 * - Priority-aware: 'unsafe' cues interrupt immediately regardless of debounce
 * - Gracefully no-ops if SpeechSynthesis is unavailable
 */

import { useEffect, useRef, useCallback } from 'react'
import { useUiStore } from '@/store'
import type { LiveCue } from '@/types'

const DEBOUNCE_MS = 4000

export function useSpeechCue() {
  const audioFeedback = useUiStore((s) => s.audioFeedback)
  const lastSpokenRef = useRef<{ text: string; at: number } | null>(null)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Cancel any in-progress speech on unmount
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  const speak = useCallback(
    (cue: LiveCue | null) => {
      if (!audioFeedback || !supported || !cue) return

      const now = Date.now()
      const isUnsafe = cue.priority === 'unsafe'
      const alreadyRecent =
        lastSpokenRef.current?.text === cue.text &&
        now - lastSpokenRef.current.at < DEBOUNCE_MS

      // Unsafe cues always interrupt; others respect debounce
      if (alreadyRecent && !isUnsafe) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(cue.text)
      utterance.rate   = isUnsafe ? 1.1 : 0.95
      utterance.pitch  = isUnsafe ? 1.2 : 1.0
      utterance.volume = 1.0

      // Prefer a natural-sounding voice if available
      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural'))
      ) ?? voices.find((v) => v.lang.startsWith('en'))
      if (preferred) utterance.voice = preferred

      window.speechSynthesis.speak(utterance)
      lastSpokenRef.current = { text: cue.text, at: now }
    },
    [audioFeedback, supported]
  )

  /** Speak a plain string (e.g. "Good form!" on quality change) */
  const speakRaw = useCallback(
    (text: string, rate = 0.95) => {
      if (!audioFeedback || !supported) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.volume = 1.0
      window.speechSynthesis.speak(utterance)
    },
    [audioFeedback, supported]
  )

  return { speak, speakRaw, supported }
}
