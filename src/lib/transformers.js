export function mapTemplateRecord(record) {
  return {
    id: record.id,
    name: record.name,
    notes: record.notes ?? '',
    exercises: (record.template_exercises ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        notes: exercise.notes ?? '',
        sets: (exercise.template_sets ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((set) => ({
            id: set.id,
            reps: set.reps,
            weight: Number(set.weight),
            restSec: set.rest_sec,
            notes: set.notes ?? '',
            completed: false,
            completedAt: null,
          })),
      })),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapWorkoutRecord(record) {
  return {
    id: record.id,
    name: record.name,
    notes: record.notes ?? '',
    startedAt: record.started_at,
    pausedAt: record.paused_at,
    totalPausedMs: record.total_paused_ms ?? 0,
    status: record.status,
    sourceTemplateId: record.source_template_id,
    restUntil: record.rest_until,
    finishedAt: record.finished_at,
    durationMs: record.duration_ms,
    exercises: (record.workout_exercises ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        notes: exercise.notes ?? '',
        sets: (exercise.workout_sets ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((set) => ({
            id: set.id,
            reps: set.reps,
            weight: Number(set.weight),
            restSec: set.rest_sec,
            notes: set.notes ?? '',
            completed: set.completed,
            completedAt: set.completed_at,
          })),
      })),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
