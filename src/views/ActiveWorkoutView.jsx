import { useMemo, useState } from 'react';
import { CheckCircle2, Pause, Play, Plus, Save, Timer, X } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ExerciseCard from '../components/ExerciseCard';
import StatCard from '../components/StatCard';
import { EXERCISE_LIBRARY, calcWorkoutDuration, calcWorkoutVolume } from '../lib/workout-utils';
import { formatClock, formatDuration } from '../lib/format';

export default function ActiveWorkoutView({
  workout,
  now,
  onWorkoutChange,
  onPauseToggle,
  onFinish,
  onDiscard,
  onSaveTemplate,
  onAddExercise,
  onExerciseChange,
  onExerciseDelete,
  onAddSet,
  onDuplicateSet,
  onDeleteSet,
  onSetField,
  onToggleComplete,
}) {
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [customExercise, setCustomExercise] = useState('');
  const duration = calcWorkoutDuration(workout, now);
  const restRemaining = workout?.restUntil ? Math.max(0, Math.ceil((new Date(workout.restUntil).getTime() - now) / 1000)) : 0;

  const suggestions = useMemo(() => {
    const query = exerciseQuery.trim().toLowerCase();
    if (!query) return EXERCISE_LIBRARY.slice(0, 8);
    return EXERCISE_LIBRARY.filter((name) => name.toLowerCase().includes(query)).slice(0, 8);
  }, [exerciseQuery]);

  if (!workout) {
    return (
      <EmptyState
        title="No active workout"
        description="Start from a blank session or use a template. Once a workout is active, logging stays inline and fast."
      />
    );
  }

  return (
    <div className="stack-xl">
      <section className="grid two-up wide-left">
        <div className="card stack-lg">
          <div className="row-between wrap-gap">
            <div className="grow stack-sm">
              <span className="badge">Active workout</span>
              <input
                className="title-input"
                value={workout.name}
                onChange={(e) => onWorkoutChange({ name: e.target.value })}
              />
              <textarea
                value={workout.notes ?? ''}
                onChange={(e) => onWorkoutChange({ notes: e.target.value })}
                placeholder="Workout notes (optional)"
                rows={2}
              />
            </div>
            <div className="grid four-up compact-grid">
              <StatCard label="Duration" value={formatDuration(duration)} icon={Timer} />
              <StatCard label="Exercises" value={workout.exercises.length} />
              <StatCard label="Volume" value={`${Math.round(calcWorkoutVolume(workout)).toLocaleString()} lb`} />
              <StatCard label="Rest" value={restRemaining > 0 ? formatClock(restRemaining) : 'Ready'} hint="Starts on completed set" />
            </div>
          </div>

          <div className="row-wrap">
            <button className="btn btn-primary" onClick={onPauseToggle}>
              {workout.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
              {workout.status === 'active' ? 'Pause' : 'Resume'}
            </button>
            <button className="btn btn-outline" onClick={onSaveTemplate}><Save size={16} /> Save as Template</button>
            <button className="btn btn-outline" onClick={onFinish}><CheckCircle2 size={16} /> Finish Workout</button>
            <button className="btn btn-ghost danger-text" onClick={onDiscard}><X size={16} /> Discard</button>
          </div>
        </div>

        <div className="card stack-lg">
          <div>
            <h3>Add exercise</h3>
            <p className="muted">Pick a common lift or create an ad-hoc exercise.</p>
          </div>
          <input
            value={exerciseQuery}
            onChange={(e) => setExerciseQuery(e.target.value)}
            placeholder="Search exercise library"
          />
          <div className="chip-wrap">
            {suggestions.map((name) => (
              <button key={name} className="chip-btn" onClick={() => onAddExercise(name)}>+ {name}</button>
            ))}
          </div>
          <div className="stack-sm">
            <label className="field">
              <span>Custom exercise</span>
              <div className="row-wrap">
                <input
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  placeholder="Example: Safety Bar Squat"
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onAddExercise(customExercise);
                    setCustomExercise('');
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </label>
          </div>
        </div>
      </section>

      {workout.exercises.length ? (
        <section className="stack-lg">
          {workout.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              onExerciseChange={(patch) => onExerciseChange(exercise.id, patch)}
              onExerciseDelete={() => onExerciseDelete(exercise.id)}
              onAddSet={() => onAddSet(exercise.id)}
              onDuplicateSet={(setId) => onDuplicateSet(exercise.id, setId)}
              onDeleteSet={(setId) => onDeleteSet(setId)}
              onSetField={(setId, field, value) => onSetField(setId, field, value)}
              onToggleComplete={(set) => onToggleComplete(set)}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No exercises yet"
          description="Add one from the library or create a custom lift. The logging flow stays inline to keep taps low during training."
          action={<button className="btn btn-primary" onClick={() => onAddExercise('Bench Press')}>Add Bench Press</button>}
        />
      )}
    </div>
  );
}
