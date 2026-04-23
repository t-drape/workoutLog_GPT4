import { CheckCircle2, Copy, Plus, Trash2 } from 'lucide-react';

export default function ExerciseCard({
  exercise,
  index,
  onExerciseChange,
  onExerciseDelete,
  onAddSet,
  onDuplicateSet,
  onDeleteSet,
  onSetField,
  onToggleComplete,
}) {
  const completed = exercise.sets.filter((set) => set.completed).length;

  return (
    <div className="card exercise-card">
      <div className="exercise-header">
        <div className="grow">
          <div className="badge-row">
            <span className="badge">Exercise {index + 1}</span>
            <span className="badge secondary">{completed}/{exercise.sets.length} sets</span>
          </div>
          <input
            className="title-input"
            value={exercise.name}
            onChange={(e) => onExerciseChange({ name: e.target.value, notes: exercise.notes })}
            placeholder="Exercise name"
          />
        </div>
        <button className="icon-btn danger" onClick={onExerciseDelete} title="Delete exercise">
          <Trash2 size={16} />
        </button>
      </div>

      <textarea
        value={exercise.notes ?? ''}
        onChange={(e) => onExerciseChange({ name: exercise.name, notes: e.target.value })}
        placeholder="Optional exercise notes"
        rows={2}
      />

      <div className="sets-wrap">
        {exercise.sets.map((set, setIndex) => (
          <div key={set.id} className={set.completed ? 'set-card complete' : 'set-card'}>
            <div className="set-top">
              <span className="badge secondary">Set {setIndex + 1}</span>
              <div className="set-actions">
                <button
                  className={set.completed ? 'icon-btn success' : 'icon-btn'}
                  onClick={() => onToggleComplete(set)}
                  title="Toggle complete"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button className="icon-btn" onClick={() => onDuplicateSet(set.id)} title="Duplicate set">
                  <Copy size={16} />
                </button>
                <button className="icon-btn danger" onClick={() => onDeleteSet(set.id)} title="Delete set">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="set-grid">
              <label className="field">
                <span>Weight</span>
                <input
                  type="number"
                  min="0"
                  step="2.5"
                  value={set.weight}
                  onChange={(e) => onSetField(set.id, 'weight', Number(e.target.value || 0))}
                />
              </label>
              <label className="field">
                <span>Reps</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={set.reps}
                  onChange={(e) => onSetField(set.id, 'reps', Number(e.target.value || 0))}
                />
              </label>
              <label className="field">
                <span>Rest sec</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={set.restSec}
                  onChange={(e) => onSetField(set.id, 'restSec', Number(e.target.value || 0))}
                />
              </label>
            </div>

            <label className="field">
              <span>Set notes</span>
              <input
                type="text"
                value={set.notes ?? ''}
                onChange={(e) => onSetField(set.id, 'notes', e.target.value)}
                placeholder="Example: add belt next set"
              />
            </label>
          </div>
        ))}
      </div>

      <button className="btn btn-outline" onClick={onAddSet}>
        <Plus size={16} /> Add Set
      </button>
    </div>
  );
}
