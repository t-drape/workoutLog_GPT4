import { formatDateShort } from './format';

export const STORAGE_KEY = 'weightlifting-tracker-v1';
export const ACTIVE_DRAFT_KEY = 'liftlog-active-draft-v2';

export const EXERCISE_LIBRARY = [
  'Back Squat', 'Front Squat', 'Deadlift', 'Romanian Deadlift', 'Bench Press',
  'Incline Bench Press', 'Overhead Press', 'Push Press', 'Barbell Row', 'Pull-Up',
  'Lat Pulldown', 'Dumbbell Press', 'Dumbbell Row', 'Leg Press', 'Leg Curl',
  'Leg Extension', 'Lunge', 'Hip Thrust', 'Bicep Curl', 'Tricep Pushdown',
  'Lateral Raise', 'Cable Fly', 'Seated Row', 'Calf Raise'
];

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function blankSet(seed = {}) {
  return {
    id: seed.id ?? uid(),
    reps: seed.reps ?? 8,
    weight: seed.weight ?? 0,
    restSec: seed.restSec ?? 90,
    notes: seed.notes ?? '',
    completed: seed.completed ?? false,
    completedAt: seed.completedAt ?? null,
  };
}

export function makeTemplateExercise(name, setsCount = 3, reps = 8, weight = 0, restSec = 90) {
  return {
    id: uid(),
    name,
    notes: '',
    sets: Array.from({ length: setsCount }).map(() => ({
      id: uid(),
      reps,
      weight,
      restSec,
      notes: '',
      completed: false,
      completedAt: null,
    })),
  };
}

export const DEFAULT_TEMPLATES = [
  {
    id: uid(),
    name: 'Push Day',
    notes: 'Chest, shoulders, triceps',
    exercises: [
      makeTemplateExercise('Bench Press', 3, 8, 135, 120),
      makeTemplateExercise('Overhead Press', 3, 6, 85, 120),
      makeTemplateExercise('Incline Bench Press', 3, 10, 95, 90),
      makeTemplateExercise('Tricep Pushdown', 3, 12, 50, 60),
    ],
  },
  {
    id: uid(),
    name: 'Pull Day',
    notes: 'Back and biceps',
    exercises: [
      makeTemplateExercise('Deadlift', 3, 5, 225, 180),
      makeTemplateExercise('Barbell Row', 3, 8, 115, 120),
      makeTemplateExercise('Pull-Up', 3, 8, 0, 90),
      makeTemplateExercise('Bicep Curl', 3, 12, 25, 60),
    ],
  },
  {
    id: uid(),
    name: 'Leg Day',
    notes: 'Squat focus',
    exercises: [
      makeTemplateExercise('Back Squat', 4, 5, 185, 180),
      makeTemplateExercise('Romanian Deadlift', 3, 8, 135, 120),
      makeTemplateExercise('Leg Press', 3, 12, 270, 90),
      makeTemplateExercise('Calf Raise', 3, 15, 90, 45),
    ],
  },
];

export function createBlankWorkout() {
  const nowIso = new Date().toISOString();
  return {
    id: uid(),
    name: `Workout ${formatDateShort(nowIso)}`,
    notes: '',
    startedAt: nowIso,
    pausedAt: null,
    totalPausedMs: 0,
    status: 'active',
    sourceTemplateId: null,
    restUntil: null,
    exercises: [],
  };
}

export function createWorkoutFromTemplate(template) {
  return {
    id: uid(),
    name: template.name,
    notes: template.notes ?? '',
    startedAt: new Date().toISOString(),
    pausedAt: null,
    totalPausedMs: 0,
    status: 'active',
    sourceTemplateId: template.id,
    restUntil: null,
    exercises: template.exercises.map((exercise) => ({
      id: uid(),
      name: exercise.name,
      notes: exercise.notes ?? '',
      sets: exercise.sets.map((set) => blankSet(set)),
    })),
  };
}

export function cloneForTemplate(workout) {
  return {
    id: uid(),
    name: `${workout.name} Template`,
    notes: workout.notes ?? '',
    exercises: workout.exercises.map((exercise) => ({
      id: uid(),
      name: exercise.name,
      notes: exercise.notes ?? '',
      sets: exercise.sets.map((set) => ({
        id: uid(),
        reps: Number(set.reps ?? 8),
        weight: Number(set.weight ?? 0),
        restSec: Number(set.restSec ?? 90),
        notes: set.notes ?? '',
        completed: false,
        completedAt: null,
      })),
    })),
  };
}

export function calcWorkoutDuration(workout, now = Date.now()) {
  if (!workout) return 0;
  const startedAt = new Date(workout.startedAt).getTime();
  const pausedAt = workout.pausedAt ? new Date(workout.pausedAt).getTime() : null;
  const endPoint = workout.status === 'paused' && pausedAt ? pausedAt : now;
  return Math.max(0, endPoint - startedAt - Number(workout.totalPausedMs ?? 0));
}

export function calcSetVolume(set) {
  return Number(set.reps ?? 0) * Number(set.weight ?? 0);
}

export function calcWorkoutVolume(workout) {
  if (!workout) return 0;
  return workout.exercises.reduce((total, ex) => (
    total + ex.sets.reduce((sum, set) => sum + (set.completed ? calcSetVolume(set) : 0), 0)
  ), 0);
}

export function buildProgress(history) {
  const byExercise = new Map();
  history.forEach((session) => {
    session.exercises.forEach((exercise) => {
      const key = exercise.name.trim();
      if (!key) return;
      const completedSets = exercise.sets.filter((set) => set.completed);
      if (!completedSets.length) return;
      if (!byExercise.has(key)) {
        byExercise.set(key, {
          name: key,
          sessions: [],
          maxWeight: 0,
          bestVolume: 0,
          totalVolume: 0,
          prRepSet: null,
        });
      }
      const item = byExercise.get(key);
      const volume = completedSets.reduce((sum, set) => sum + calcSetVolume(set), 0);
      const maxWeight = completedSets.reduce((max, set) => Math.max(max, Number(set.weight ?? 0)), 0);
      const bestRepSet = completedSets.reduce((best, set) => {
        const score = Number(set.weight ?? 0) * Number(set.reps ?? 0);
        if (!best || score > best.score) return { ...set, score };
        return best;
      }, null);
      item.sessions.push({
        sessionId: session.id,
        sessionName: session.name,
        date: session.finishedAt,
        volume,
        maxWeight,
      });
      item.maxWeight = Math.max(item.maxWeight, maxWeight);
      item.bestVolume = Math.max(item.bestVolume, volume);
      item.totalVolume += volume;
      if (!item.prRepSet || (bestRepSet && bestRepSet.score > item.prRepSet.score)) {
        item.prRepSet = bestRepSet;
      }
    });
  });

  return Array.from(byExercise.values())
    .map((item) => {
      const sortedSessions = [...item.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = sortedSessions[0] ?? null;
      const previous = sortedSessions[1] ?? null;
      return {
        ...item,
        latest,
        previous,
        sessionCount: sortedSessions.length,
      };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume);
}

export function saveActiveDraft(workout) {
  if (!workout) {
    localStorage.removeItem(ACTIVE_DRAFT_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(workout));
}

export function loadActiveDraft() {
  try {
    const raw = localStorage.getItem(ACTIVE_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
