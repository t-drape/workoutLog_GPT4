import { CheckCircle2, Pencil } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import { calcSetVolume, calcWorkoutVolume } from '../lib/workout-utils';
import { formatDateShort, formatDuration } from '../lib/format';

export default function HistoryView({ history }) {
  if (!history.length) {
    return (
      <EmptyState
        title="No workout history yet"
        description="Finish a workout and it will show up here with completed volume, exercise details, and timestamps."
      />
    );
  }

  return (
    <div className="stack-xl">
      <SectionHeader title="Workout history" subtitle="Recent sessions with exercise detail and completed volume." />
      <div className="stack-lg">
        {history.map((session) => (
          <div key={session.id} className="card stack-md">
            <div className="row-between wrap-gap">
              <div>
                <h3>{session.name}</h3>
                <p className="muted">{formatDateShort(session.finishedAt)} • {formatDuration(session.durationMs)}</p>
              </div>
              <div className="row-wrap">
                <span className="badge">{session.exercises.length} exercises</span>
                <span className="badge secondary">{Math.round(calcWorkoutVolume(session)).toLocaleString()} lb volume</span>
              </div>
            </div>

            {session.exercises.map((exercise) => {
              const completedSets = exercise.sets.filter((set) => set.completed);
              const exerciseVolume = completedSets.reduce((sum, set) => sum + calcSetVolume(set), 0);
              return (
                <div key={exercise.id} className="sub-card stack-sm">
                  <div className="row-between wrap-gap">
                    <div>
                      <strong>{exercise.name}</strong>
                      <p className="muted small">{completedSets.length} completed sets</p>
                    </div>
                    <span className="badge secondary">{Math.round(exerciseVolume).toLocaleString()} lb</span>
                  </div>
                  <div className="grid three-up">
                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className={set.completed ? 'mini-card complete' : 'mini-card'}>
                        <div className="row-between">
                          <strong>Set {index + 1}</strong>
                          {set.completed ? <CheckCircle2 size={16} /> : <Pencil size={16} />}
                        </div>
                        <p className="muted small">{set.weight} lb • {set.reps} reps</p>
                        <p className="muted small">Rest {set.restSec}s</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
