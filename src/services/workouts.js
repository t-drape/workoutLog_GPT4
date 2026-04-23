import { supabase } from '../lib/supabase';
import { mapWorkoutRecord } from '../lib/transformers';

export async function fetchWorkouts({ status } = {}) {
  let query = supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        *,
        workout_sets (*)
      )
    `)
    .order('started_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapWorkoutRecord);
}

export async function fetchWorkoutById(workoutId) {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        *,
        workout_sets (*)
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error) throw error;
  return mapWorkoutRecord(data);
}

export async function createWorkout(userId, workout) {
  const { exercises = [], ...root } = workout;

  const { data: workoutRow, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      source_template_id: root.sourceTemplateId ?? null,
      name: root.name,
      notes: root.notes ?? '',
      status: root.status ?? 'active',
      started_at: root.startedAt,
      paused_at: root.pausedAt,
      total_paused_ms: root.totalPausedMs ?? 0,
      rest_until: root.restUntil,
      finished_at: root.finishedAt ?? null,
      duration_ms: root.durationMs ?? null,
    })
    .select()
    .single();

  if (workoutError) throw workoutError;

  for (let i = 0; i < exercises.length; i += 1) {
    const ex = exercises[i];
    const { sets = [], ...exerciseRoot } = ex;
    const { data: exerciseRow, error: exerciseError } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutRow.id,
        sort_order: i,
        name: exerciseRoot.name,
        notes: exerciseRoot.notes ?? '',
      })
      .select()
      .single();

    if (exerciseError) throw exerciseError;

    if (sets.length) {
      const setRows = sets.map((set, idx) => ({
        workout_exercise_id: exerciseRow.id,
        sort_order: idx,
        reps: Number(set.reps ?? 0),
        weight: Number(set.weight ?? 0),
        rest_sec: Number(set.restSec ?? 0),
        notes: set.notes ?? '',
        completed: !!set.completed,
        completed_at: set.completedAt ?? null,
      }));
      const { error: setsError } = await supabase.from('workout_sets').insert(setRows);
      if (setsError) throw setsError;
    }
  }

  return fetchWorkoutById(workoutRow.id);
}

export async function updateWorkout(workoutId, patch) {
  const payload = {};
  if ('name' in patch) payload.name = patch.name;
  if ('notes' in patch) payload.notes = patch.notes ?? '';
  if ('status' in patch) payload.status = patch.status;
  if ('pausedAt' in patch) payload.paused_at = patch.pausedAt;
  if ('totalPausedMs' in patch) payload.total_paused_ms = patch.totalPausedMs;
  if ('restUntil' in patch) payload.rest_until = patch.restUntil;
  if ('finishedAt' in patch) payload.finished_at = patch.finishedAt;
  if ('durationMs' in patch) payload.duration_ms = patch.durationMs;

  const { data, error } = await supabase
    .from('workouts')
    .update(payload)
    .eq('id', workoutId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addWorkoutExercise(workoutId, exercise, sortOrder) {
  const { data: exerciseRow, error: exerciseError } = await supabase
    .from('workout_exercises')
    .insert({
      workout_id: workoutId,
      sort_order: sortOrder,
      name: exercise.name,
      notes: exercise.notes ?? '',
    })
    .select()
    .single();

  if (exerciseError) throw exerciseError;

  if (exercise.sets?.length) {
    const setRows = exercise.sets.map((set, idx) => ({
      workout_exercise_id: exerciseRow.id,
      sort_order: idx,
      reps: Number(set.reps ?? 0),
      weight: Number(set.weight ?? 0),
      rest_sec: Number(set.restSec ?? 0),
      notes: set.notes ?? '',
      completed: !!set.completed,
      completed_at: set.completedAt ?? null,
    }));
    const { error: setsError } = await supabase.from('workout_sets').insert(setRows);
    if (setsError) throw setsError;
  }

  return exerciseRow;
}

export async function updateWorkoutExercise(exerciseId, patch) {
  const payload = {};
  if ('name' in patch) payload.name = patch.name;
  if ('notes' in patch) payload.notes = patch.notes ?? '';
  const { data, error } = await supabase
    .from('workout_exercises')
    .update(payload)
    .eq('id', exerciseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkoutExercise(exerciseId) {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId);
  if (error) throw error;
}

export async function addSet(workoutExerciseId, set, sortOrder) {
  const { data, error } = await supabase
    .from('workout_sets')
    .insert({
      workout_exercise_id: workoutExerciseId,
      sort_order: sortOrder,
      reps: Number(set.reps ?? 0),
      weight: Number(set.weight ?? 0),
      rest_sec: Number(set.restSec ?? 0),
      notes: set.notes ?? '',
      completed: !!set.completed,
      completed_at: set.completedAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSet(setId, patch) {
  const payload = {};
  if ('reps' in patch) payload.reps = Number(patch.reps);
  if ('weight' in patch) payload.weight = Number(patch.weight);
  if ('restSec' in patch) payload.rest_sec = Number(patch.restSec);
  if ('notes' in patch) payload.notes = patch.notes ?? '';
  if ('completed' in patch) payload.completed = !!patch.completed;
  if ('completedAt' in patch) payload.completed_at = patch.completedAt ?? null;

  const { data, error } = await supabase
    .from('workout_sets')
    .update(payload)
    .eq('id', setId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSet(setId) {
  const { error } = await supabase.from('workout_sets').delete().eq('id', setId);
  if (error) throw error;
}
