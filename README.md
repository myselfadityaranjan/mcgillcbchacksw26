# StrainSense: Camera-Based Posture Assessment and Corrective Drill Coaching

Browser app that uses a webcam to assess posture and movement, flags common alignment issues, and coaches the user through corrective drills with live visual and voice feedback. Built in one weekend at the McGill Claude Builders Club Hackathon (Winter 2026), where it placed 1st in the Biology & Physical Health track and 3rd overall out of 160 participants.


## How it works

The app runs in three stages: assess, analyze, coach.

**1. Assessment.** The user performs five guided movements in front of the camera: front stance, side stance, overhead arm raise, bodyweight squat, and single-leg balance. Each step has a countdown and a short capture window. A calibration check confirms the full body is in frame and the user is standing still before capture starts.

**2. Analysis.** MediaPipe Pose Landmarker returns 33 body landmarks per frame. From the captured frames, the app computes posture metrics (head offset relative to the shoulders, shoulder height difference, torso lean, knee tracking during the squat, left-right asymmetry, and others). Rule-based detectors compare each metric against mild and significant thresholds and classify the following issues:

- Rounded shoulders
- Forward head posture
- Anterior pelvic tilt
- Knee valgus
- Thoracic kyphosis
- Neck flexion
- Lateral asymmetry

Each detected issue is reported with a severity, a confidence value, and an evidence frame showing the skeleton overlay from the step where it was detected.

**3. Coaching.** Detected issues map to a corrective drill plan (doorway pec stretch, wall angel, hip flexor stretch, squat alignment drill, split squat, chin tuck, cat-cow). During each drill, the app tracks the user's form frame by frame, selects the highest-priority correction, and displays it as an on-screen cue with arrows on the affected joints. The same cue is read aloud with the browser's speech synthesis. Each drill ends with a form quality score.

The app is a movement-awareness tool, not a diagnostic one. Thresholds are heuristic, and results are framed as patterns consistent with an issue rather than diagnoses.

## Stack

- React 18, TypeScript, Vite
- MediaPipe Tasks Vision (Pose Landmarker; GPU delegate with CPU fallback)
- Zustand for state, Tailwind CSS for styling
- Web Speech API for voice cues

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints, allow camera access, and stand 2 to 3 m from the camera so your full body is visible. Optional settings are listed in `.env.example`.

## Files

- `src/lib/poseEngine.ts`: MediaPipe Pose Landmarker wrapper
- `src/lib/calibration.ts`: framing and stillness checks before capture
- `src/lib/metrics.ts`: posture metrics computed from landmarks
- `src/lib/issueDetectors.ts`: threshold-based issue classification
- `src/lib/planBuilder.ts`: maps detected issues to a drill plan
- `src/lib/cueEngine.ts`, `src/lib/liveCoach.ts`: live form checking and cue selection during drills
- `src/lib/voiceCoach.ts`: spoken cues
- `src/data/assessmentSteps.ts`: the five assessment movements

## Team

Aditya Ranjan, Will Callaghan, Brendan Carney
