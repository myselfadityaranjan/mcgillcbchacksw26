// ──────────────────────────────────────────────────────────────
// voiceCoach.ts — Web Speech API wrapper for spoken cues
// Queues utterances and avoids overlapping speech.
// Uses a warm female voice for a coaching feel.
// ──────────────────────────────────────────────────────────────

let speaking = false;
let lastSpoken = '';
let lastSpokeAt = 0;
let cachedVoice: SpeechSynthesisVoice | null = null;

/** Minimum ms between repeated spoken cues */
const COOLDOWN_MS = 4_000;

/**
 * Pick the best available female voice.
 * Priority: Samantha (macOS) > Google UK English Female > any female-sounding en voice.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Ranked preference list (case-insensitive partial match on name)
  const preferred = [
    'Samantha',           // macOS — warm, natural female
    'Karen',              // macOS AU English female
    'Google UK English Female',
    'Google US English',  // often female on Chrome
    'Microsoft Zira',     // Windows female
    'Moira',              // macOS Irish English female
    'Fiona',              // macOS Scottish English female
    'Victoria',           // macOS
    'Tessa',              // macOS South African English
  ];

  for (const name of preferred) {
    const match = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes(name.toLowerCase()),
    );
    if (match) {
      cachedVoice = match;
      return match;
    }
  }

  // Fallback: any English voice
  const fallback = voices.find((v) => v.lang.startsWith('en'));
  if (fallback) cachedVoice = fallback;
  return fallback ?? null;
}

// Pre-load voices (Chrome fires voiceschanged async)
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}

/** Speak a cue aloud. Deduplicates and rate-limits automatically. */
export function speakCue(text: string): void {
  if (!('speechSynthesis' in window)) return;

  const now = Date.now();
  if (text === lastSpoken && now - lastSpokeAt < COOLDOWN_MS) return;
  if (speaking) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.15;
  utter.volume = 0.85;

  const voice = pickVoice();
  if (voice) utter.voice = voice;

  speaking = true;
  lastSpoken = text;
  lastSpokeAt = now;

  utter.onend = () => { speaking = false; };
  utter.onerror = () => { speaking = false; };

  synth.speak(utter);
}

/** Speak a step instruction (higher priority, always plays). */
export function speakInstruction(text: string): void {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  synth.cancel();
  speaking = false;
  lastSpoken = '';

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1.12;
  utter.volume = 0.9;

  const voice = pickVoice();
  if (voice) utter.voice = voice;

  speaking = true;
  utter.onend = () => { speaking = false; };
  utter.onerror = () => { speaking = false; };

  synth.speak(utter);
}

/** Stop all speech. */
export function stopSpeech(): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  speaking = false;
  lastSpoken = '';
}
