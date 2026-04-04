import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronDown, ChevronUp, Dumbbell, Repeat, Wind } from 'lucide-react';
import type { DetectedIssue, IssueId } from '../types/analysis';
import type { DrillRecommendation } from '../types/plan';

// ── Exercise library (beyond the drill recs — daily mobility work) ──────

interface DailyExercise {
  name: string;
  duration: string;
  sets?: string;
  icon: 'stretch' | 'strength' | 'breathing';
  targetIssues: IssueId[];
  instruction: string;
}

const EXERCISE_LIBRARY: DailyExercise[] = [
  { name: 'Cat-Cow Stretch', duration: '60s', sets: '10 reps', icon: 'stretch', targetIssues: ['rounded-shoulders', 'anterior-pelvic-tilt', 'thoracic-kyphosis'], instruction: 'On all fours, alternate between arching and rounding your spine with each breath.' },
  { name: 'Chin Tucks', duration: '30s', sets: '10 reps', icon: 'strength', targetIssues: ['forward-head-posture', 'neck-flexion'], instruction: 'Pull your chin straight back, creating a double chin. Hold 3 seconds.' },
  { name: 'Doorway Pec Stretch', duration: '30s each side', icon: 'stretch', targetIssues: ['rounded-shoulders', 'thoracic-kyphosis'], instruction: 'Place forearm on door frame at shoulder height. Step through until you feel chest stretch.' },
  { name: 'Wall Angel', duration: '45s', sets: '10 reps', icon: 'strength', targetIssues: ['rounded-shoulders', 'forward-head-posture', 'thoracic-kyphosis'], instruction: 'Back against wall. Slide arms from W to Y while keeping contact.' },
  { name: 'Hip Flexor Stretch', duration: '30s each side', icon: 'stretch', targetIssues: ['anterior-pelvic-tilt'], instruction: 'Half-kneeling lunge. Tuck pelvis, squeeze back glute, lean forward gently.' },
  { name: 'Glute Bridge', duration: '45s', sets: '12 reps', icon: 'strength', targetIssues: ['anterior-pelvic-tilt', 'knee-valgus'], instruction: 'Lie on back, feet flat. Drive hips up squeezing glutes. Hold 2s at top.' },
  { name: 'Clamshells', duration: '30s each side', sets: '15 reps', icon: 'strength', targetIssues: ['knee-valgus', 'lateral-asymmetry'], instruction: 'Side-lying, knees bent 45°. Open top knee keeping feet together. Slow and controlled.' },
  { name: 'Bird Dog', duration: '60s', sets: '8 each side', icon: 'strength', targetIssues: ['lateral-asymmetry', 'anterior-pelvic-tilt'], instruction: 'On all fours. Extend opposite arm and leg. Hold 3s. Keep hips level.' },
  { name: 'Deep Breathing', duration: '2 min', icon: 'breathing', targetIssues: ['rounded-shoulders', 'forward-head-posture', 'anterior-pelvic-tilt', 'knee-valgus', 'lateral-asymmetry', 'thoracic-kyphosis', 'neck-flexion'], instruction: 'Diaphragmatic breathing. Inhale 4s, hold 4s, exhale 6s. Relaxes postural muscles.' },
  { name: 'Single Leg Balance', duration: '30s each side', icon: 'strength', targetIssues: ['knee-valgus', 'lateral-asymmetry'], instruction: 'Stand on one leg, slight knee bend. Keep hips level. Eyes forward.' },
  { name: 'Thoracic Rotation', duration: '30s each side', sets: '8 reps', icon: 'stretch', targetIssues: ['rounded-shoulders', 'lateral-asymmetry', 'thoracic-kyphosis'], instruction: 'Side-lying, knees stacked. Rotate top arm open, following with your gaze.' },
  { name: 'Squat to Stand', duration: '60s', sets: '6 reps', icon: 'stretch', targetIssues: ['knee-valgus', 'anterior-pelvic-tilt'], instruction: 'Hinge down, grab toes. Squat deep, chest up. Stand and repeat.' },
  { name: 'Neck Retraction Hold', duration: '20s', sets: '5 reps', icon: 'strength', targetIssues: ['neck-flexion', 'forward-head-posture'], instruction: 'Seated tall. Pull head straight back and tuck chin. Hold 5 seconds. Release slowly.' },
  { name: 'Prone Y-T-W Raises', duration: '45s', sets: '8 reps', icon: 'strength', targetIssues: ['thoracic-kyphosis', 'rounded-shoulders'], instruction: 'Lie face-down, arms extended. Raise arms into Y, then T, then W shapes. Squeeze shoulder blades.' },
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_THEMES = ['Mobility', 'Strength', 'Recovery', 'Strength', 'Mobility', 'Active Recovery', 'Rest'];

interface DayPlan {
  dayIndex: number;
  dayName: string;
  theme: string;
  exercises: DailyExercise[];
  totalMinutes: number;
}

function buildWeeklyPlan(issues: DetectedIssue[], _recs: DrillRecommendation[]): DayPlan[] {
  const issueIds = issues.map((i) => i.id);

  // Score exercises by relevance to user's issues
  const scored = EXERCISE_LIBRARY.map((ex) => ({
    exercise: ex,
    relevance: ex.targetIssues.filter((t) => issueIds.includes(t)).length,
  })).sort((a, b) => b.relevance - a.relevance);

  const relevant = scored.filter((s) => s.relevance > 0).map((s) => s.exercise);
  const general = scored.filter((s) => s.relevance === 0).map((s) => s.exercise);
  const allExercises = [...relevant, ...general];

  return DAY_NAMES.map((dayName, dayIndex) => {
    if (dayIndex === 6) {
      // Sunday = rest day
      return { dayIndex, dayName, theme: DAY_THEMES[dayIndex], exercises: [], totalMinutes: 0 };
    }

    const isMobility = dayIndex === 0 || dayIndex === 4;
    const isStrength = dayIndex === 1 || dayIndex === 3;
    const isRecovery = dayIndex === 2 || dayIndex === 5;

    let dayExercises: DailyExercise[];
    if (isRecovery) {
      // Light day: breathing + 2 stretches
      const stretches = allExercises.filter((e) => e.icon === 'stretch').slice(0, 2);
      const breathing = allExercises.find((e) => e.icon === 'breathing');
      dayExercises = breathing ? [breathing, ...stretches] : stretches;
    } else if (isMobility) {
      // Mobility: mix of stretches
      dayExercises = allExercises.filter((e) => e.icon === 'stretch' || e.icon === 'breathing').slice(0, 5);
    } else if (isStrength) {
      // Strength: corrective exercises
      dayExercises = allExercises.filter((e) => e.icon === 'strength').slice(0, 4);
      // Add one stretch as cooldown
      const cooldown = allExercises.find((e) => e.icon === 'stretch');
      if (cooldown) dayExercises.push(cooldown);
    } else {
      dayExercises = allExercises.slice(0, 4);
    }

    // Estimate minutes
    const totalMinutes = dayExercises.reduce((sum, ex) => {
      const secs = parseInt(ex.duration) || 60;
      return sum + secs / 60;
    }, 0);

    return {
      dayIndex,
      dayName,
      theme: DAY_THEMES[dayIndex],
      exercises: dayExercises,
      totalMinutes: Math.max(5, Math.round(totalMinutes * 1.5)), // account for rest between sets
    };
  });
}

const ICON_MAP = {
  stretch: Wind,
  strength: Dumbbell,
  breathing: Repeat,
};

const ICON_COLOR = {
  stretch: 'text-[#5B8CB0] bg-[#5B8CB0]/10',
  strength: 'text-brand bg-brand/10',
  breathing: 'text-warning bg-warning/10',
};

function DayCard({ plan, isExpanded, onToggle }: { plan: DayPlan; isExpanded: boolean; onToggle: () => void }) {
  const isRest = plan.exercises.length === 0;
  const isToday = new Date().getDay() === (plan.dayIndex === 6 ? 0 : plan.dayIndex + 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: plan.dayIndex * 0.05, duration: 0.3 }}
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        isToday ? 'border-brand/40 bg-brand/[0.03] shadow-[0_0_0_1px_rgba(107,158,119,0.15)]' : 'border-border bg-surface'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer bg-transparent border-none text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
            isToday ? 'bg-brand text-white' : isRest ? 'bg-elevated text-text-3' : 'bg-elevated text-text-1'
          }`}>
            {plan.dayName.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-1">{plan.dayName}</span>
              {isToday && <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">TODAY</span>}
            </div>
            <span className="text-xs text-text-3">{plan.theme}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isRest && (
            <span className="text-xs text-text-3 flex items-center gap-1">
              <Clock size={11} />
              ~{plan.totalMinutes} min
            </span>
          )}
          {isRest ? (
            <span className="text-xs text-text-3">Rest day</span>
          ) : (
            isExpanded ? <ChevronUp size={14} className="text-text-3" /> : <ChevronDown size={14} className="text-text-3" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && !isRest && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {plan.exercises.map((ex, i) => {
                const Icon = ICON_MAP[ex.icon];
                return (
                  <div key={i} className="flex items-start gap-3 py-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ICON_COLOR[ex.icon]}`}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-1">{ex.name}</span>
                        <span className="text-[11px] text-text-3 tabular-nums shrink-0 ml-2">
                          {ex.duration}{ex.sets ? ` · ${ex.sets}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-text-3 mt-0.5">{ex.instruction}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function DailyExercisePlan({ issues, recommendations }: { issues: DetectedIssue[]; recommendations: DrillRecommendation[] }) {
  const weekPlan = buildWeeklyPlan(issues, recommendations);
  const todayIdx = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // Convert Sun=0 to our Mon=0 index
  })();
  const [expandedDay, setExpandedDay] = useState<number>(todayIdx);

  const totalWeeklyMinutes = weekPlan.reduce((s, d) => s + d.totalMinutes, 0);
  const activeDays = weekPlan.filter((d) => d.exercises.length > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-surface border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-brand/[0.03]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center">
            <Calendar size={16} className="text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-1">Your Weekly Exercise Plan</h3>
            <p className="text-xs text-text-3">
              {activeDays} active days · ~{totalWeeklyMinutes} min/week · Personalized to your patterns
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {weekPlan.map((plan) => (
          <DayCard
            key={plan.dayIndex}
            plan={plan}
            isExpanded={expandedDay === plan.dayIndex}
            onToggle={() => setExpandedDay(expandedDay === plan.dayIndex ? -1 : plan.dayIndex)}
          />
        ))}
      </div>

      <div className="px-5 pb-4">
        <p className="text-[11px] text-text-3 text-center">
          Exercises are tailored to your detected patterns · Adjust intensity based on comfort · Consistency beats intensity
        </p>
      </div>
    </motion.div>
  );
}
