// ──────────────────────────────────────────────────────────────
// voiceCoach.ts — Web Speech API wrapper for spoken cues
// Queues utterances and avoids overlapping speech.
// ──────────────────────────────────────────────────────────────

let speaking = false;
let lastSpoken = '';
let lastSpokeAt = 0;

/** Minimum ms between repeated spoken cues */
const COOLDOWN_MS = 4_000;

/** Speak a cue aloud. Deduplicates and rate-limits automatically. */
export function speakCue(text: string): void {
  if (!('speechSynthesis' in window)) return;

  const now = Date.now();
  if (text === lastSpoken && now - lastSpokeAt < COOLDOWN_MS) return;
  if (speaking) return;

  const synth = window.speechSynthesis;
  synth.cancel(); // cancel any queued speech

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  utter.pitch = 1.0;
  utter.volume = 0.85;

  // Try to pick a neutral English voice
  const voices = synth.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith('en') && v.name.includes('Samantha'),
  ) ?? voices.find((v) => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;

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
  utter.pitch = 1.0;
  utter.volume = 0.9;

  const voices = synth.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith('en') && v.name.includes('Samantha'),
  ) ?? voices.find((v) => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;

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
