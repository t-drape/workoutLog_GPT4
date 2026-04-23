import { STORAGE_KEY, DEFAULT_TEMPLATES } from '../lib/workout-utils';
import { createTemplate, fetchTemplates } from './templates';
import { createWorkout, fetchWorkouts } from './workouts';

export function hasLegacyLocalData() {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export async function ensureStarterTemplates(userId) {
  const existing = await fetchTemplates();
  if (existing.length) return existing;

  for (const template of DEFAULT_TEMPLATES) {
    // eslint-disable-next-line no-await-in-loop
    await createTemplate(userId, template);
  }
  return fetchTemplates();
}

export async function migrateLegacyLocalData(userId) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { migrated: false, reason: 'no-local-data' };

  const currentTemplates = await fetchTemplates();
  const currentHistory = await fetchWorkouts({ status: 'finished' });
  if (currentTemplates.length || currentHistory.length) {
    return { migrated: false, reason: 'remote-data-already-exists' };
  }

  const parsed = JSON.parse(raw);

  for (const template of parsed.templates ?? []) {
    // eslint-disable-next-line no-await-in-loop
    await createTemplate(userId, template);
  }

  for (const workout of parsed.history ?? []) {
    // eslint-disable-next-line no-await-in-loop
    await createWorkout(userId, {
      ...workout,
      status: 'finished',
      finishedAt: workout.finishedAt ?? new Date().toISOString(),
      durationMs: workout.durationMs ?? 0,
      restUntil: null,
    });
  }

  return { migrated: true };
}
