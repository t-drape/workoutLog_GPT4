import { supabase } from '../lib/supabase';
import { mapTemplateRecord } from '../lib/transformers';

export async function fetchTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      template_exercises (
        *,
        template_sets (*)
      )
    `)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTemplateRecord);
}

export async function createTemplate(userId, template) {
  const { exercises = [], ...root } = template;
  const { data: templateRow, error: templateError } = await supabase
    .from('templates')
    .insert({
      user_id: userId,
      name: root.name,
      notes: root.notes ?? '',
    })
    .select()
    .single();

  if (templateError) throw templateError;

  for (let i = 0; i < exercises.length; i += 1) {
    const ex = exercises[i];
    const { sets = [], ...exerciseRoot } = ex;
    const { data: exerciseRow, error: exerciseError } = await supabase
      .from('template_exercises')
      .insert({
        template_id: templateRow.id,
        sort_order: i,
        name: exerciseRoot.name,
        notes: exerciseRoot.notes ?? '',
      })
      .select()
      .single();

    if (exerciseError) throw exerciseError;

    if (sets.length) {
      const setRows = sets.map((set, idx) => ({
        template_exercise_id: exerciseRow.id,
        sort_order: idx,
        reps: Number(set.reps ?? 0),
        weight: Number(set.weight ?? 0),
        rest_sec: Number(set.restSec ?? 0),
        notes: set.notes ?? '',
      }));
      const { error: setsError } = await supabase.from('template_sets').insert(setRows);
      if (setsError) throw setsError;
    }
  }

  return fetchTemplateById(templateRow.id);
}

export async function fetchTemplateById(templateId) {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      template_exercises (
        *,
        template_sets (*)
      )
    `)
    .eq('id', templateId)
    .single();

  if (error) throw error;
  return mapTemplateRecord(data);
}

export async function deleteTemplate(templateId) {
  const { error } = await supabase.from('templates').delete().eq('id', templateId);
  if (error) throw error;
}
