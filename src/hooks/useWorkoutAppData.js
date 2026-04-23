import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ACTIVE_DRAFT_KEY,
  DEFAULT_TEMPLATES,
  blankSet,
  buildProgress,
  calcWorkoutDuration,
  cloneForTemplate,
  createBlankWorkout,
  createWorkoutFromTemplate,
  loadActiveDraft,
  saveActiveDraft,
} from '../lib/workout-utils';
import {
  addSet,
  addWorkoutExercise,
  createWorkout,
  deleteSet,
  deleteWorkoutExercise,
  fetchWorkouts,
  fetchWorkoutById,
  updateSet,
  updateWorkout,
  updateWorkoutExercise,
} from '../services/workouts';
import { createTemplate, deleteTemplate, fetchTemplates } from '../services/templates';
import { ensureStarterTemplates } from '../services/migration';

export function useWorkoutAppData(user) {
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await ensureStarterTemplates(user.id);
      const [remoteTemplates, allWorkouts] = await Promise.all([
        fetchTemplates(),
        fetchWorkouts(),
      ]);
      const remoteActive = allWorkouts.find((workout) => workout.status === 'active' || workout.status === 'paused') ?? null;
      const remoteHistory = allWorkouts.filter((workout) => workout.status === 'finished');
      const draft = loadActiveDraft();
      setTemplates(remoteTemplates.length ? remoteTemplates : DEFAULT_TEMPLATES);
      setHistory(remoteHistory);
      setActiveWorkout(remoteActive ?? draft ?? null);
      setView(remoteActive || draft ? 'workout' : 'dashboard');
    } catch (err) {
      setError(err.message || 'Failed to load app data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    saveActiveDraft(activeWorkout);
  }, [activeWorkout]);

  const progress = useMemo(() => buildProgress(history), [history]);

  const startBlankWorkout = useCallback(async () => {
    if (!user) return;
    const created = await createWorkout(user.id, createBlankWorkout());
    setActiveWorkout(created);
    setView('workout');
    return created;
  }, [user]);

  const startTemplateWorkout = useCallback(async (template) => {
    if (!user) return;
    const created = await createWorkout(user.id, createWorkoutFromTemplate(template));
    setActiveWorkout(created);
    setView('workout');
    return created;
  }, [user]);

  const saveCurrentAsTemplate = useCallback(async (name) => {
    if (!user || !activeWorkout) return;
    const nextTemplate = cloneForTemplate(activeWorkout);
    nextTemplate.name = name?.trim() || nextTemplate.name;
    const created = await createTemplate(user.id, nextTemplate);
    setTemplates((prev) => [created, ...prev]);
    setView('templates');
  }, [user, activeWorkout]);

  const handleDeleteTemplate = useCallback(async (templateId) => {
    await deleteTemplate(templateId);
    setTemplates((prev) => prev.filter((template) => template.id !== templateId));
  }, []);

  const updateWorkoutRoot = useCallback(async (patch) => {
    if (!activeWorkout) return;
    const optimistic = { ...activeWorkout, ...patch };
    setActiveWorkout(optimistic);
    await updateWorkout(activeWorkout.id, patch);
  }, [activeWorkout]);

  const refreshActiveWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    const latest = await fetchWorkoutById(activeWorkout.id);
    setActiveWorkout(latest);
    return latest;
  }, [activeWorkout]);

  const addExerciseByName = useCallback(async (name) => {
    if (!activeWorkout || !name.trim()) return;
    const nextExercise = {
      name: name.trim(),
      notes: '',
      sets: [blankSet()],
    };
    await addWorkoutExercise(activeWorkout.id, nextExercise, activeWorkout.exercises.length);
    await refreshActiveWorkout();
  }, [activeWorkout, refreshActiveWorkout]);

  const updateExercise = useCallback(async (exerciseId, patch) => {
    await updateWorkoutExercise(exerciseId, patch);
    await refreshActiveWorkout();
  }, [refreshActiveWorkout]);

  const removeExercise = useCallback(async (exerciseId) => {
    await deleteWorkoutExercise(exerciseId);
    await refreshActiveWorkout();
  }, [refreshActiveWorkout]);

  const appendSet = useCallback(async (exerciseId) => {
    const exercise = activeWorkout?.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    const seed = exercise.sets[exercise.sets.length - 1] ?? blankSet();
    await addSet(exerciseId, blankSet(seed), exercise.sets.length);
    await refreshActiveWorkout();
  }, [activeWorkout, refreshActiveWorkout]);

  const duplicateSet = useCallback(async (exerciseId, setId) => {
    const exercise = activeWorkout?.exercises.find((item) => item.id === exerciseId);
    const index = exercise?.sets.findIndex((set) => set.id === setId) ?? -1;
    const source = index >= 0 ? exercise.sets[index] : null;
    if (!exercise || !source) return;
    await addSet(exerciseId, blankSet(source), exercise.sets.length);
    await refreshActiveWorkout();
  }, [activeWorkout, refreshActiveWorkout]);

  const removeSet = useCallback(async (setId) => {
    await deleteSet(setId);
    await refreshActiveWorkout();
  }, [refreshActiveWorkout]);

  const patchSet = useCallback(async (setId, patch) => {
    await updateSet(setId, patch);
    await refreshActiveWorkout();
  }, [refreshActiveWorkout]);

  const toggleSetComplete = useCallback(async (set) => {
    if (!activeWorkout) return;
    const nextCompleted = !set.completed;
    await updateSet(set.id, {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    });
    if (nextCompleted && set.restSec) {
      await updateWorkout(activeWorkout.id, {
        restUntil: new Date(Date.now() + Number(set.restSec) * 1000).toISOString(),
      });
    }
    await refreshActiveWorkout();
  }, [activeWorkout, refreshActiveWorkout]);

  const togglePause = useCallback(async () => {
    if (!activeWorkout) return;
    if (activeWorkout.status === 'active') {
      await updateWorkout(activeWorkout.id, {
        status: 'paused',
        pausedAt: new Date().toISOString(),
      });
    } else {
      const pausedFor = activeWorkout.pausedAt ? Date.now() - new Date(activeWorkout.pausedAt).getTime() : 0;
      await updateWorkout(activeWorkout.id, {
        status: 'active',
        pausedAt: null,
        totalPausedMs: Number(activeWorkout.totalPausedMs ?? 0) + pausedFor,
      });
    }
    await refreshActiveWorkout();
  }, [activeWorkout, refreshActiveWorkout]);

  const finishWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    await updateWorkout(activeWorkout.id, {
      status: 'finished',
      pausedAt: null,
      restUntil: null,
      finishedAt: new Date().toISOString(),
      durationMs: calcWorkoutDuration(activeWorkout, Date.now()),
    });
    localStorage.removeItem(ACTIVE_DRAFT_KEY);
    await refresh();
    setView('history');
  }, [activeWorkout, refresh]);

  const discardWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    await updateWorkout(activeWorkout.id, {
      status: 'discarded',
      pausedAt: null,
      restUntil: null,
    });
    localStorage.removeItem(ACTIVE_DRAFT_KEY);
    await refresh();
    setView('dashboard');
  }, [activeWorkout, refresh]);

  return {
    templates,
    history,
    activeWorkout,
    view,
    setView,
    loading,
    error,
    now,
    progress,
    refresh,
    actions: {
      startBlankWorkout,
      startTemplateWorkout,
      saveCurrentAsTemplate,
      handleDeleteTemplate,
      updateWorkoutRoot,
      addExerciseByName,
      updateExercise,
      removeExercise,
      appendSet,
      duplicateSet,
      removeSet,
      patchSet,
      toggleSetComplete,
      togglePause,
      finishWorkout,
      discardWorkout,
    },
  };
}
