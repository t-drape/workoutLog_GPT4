import { BarChart3, CheckCircle2, History as HistoryIcon, LayoutTemplate, Plus } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { calcWorkoutDuration, calcWorkoutVolume } from '../lib/workout-utils';
import { formatDateShort, formatDuration } from '../lib/format';

export default function DashboardView({ templates, activeWorkout, setView, onStartBlank, onStartTemplate, history, now }) {
  const lastWorkout = history[0] ?? null;
  const totalSessions = history.length;
  const totalVolume = history.reduce((sum, session) => sum + calcWorkoutVolume(session), 0);

  return (
    <div className="stack-xl">
      <section className="grid two-up hero-grid">
        <div className="card hero-card">
          <span className="badge">Gym-ready MVP</span>
          <h2>Fast logging between sets</h2>
          <p className="muted">
            Start from a template or open a blank workout. This production version keeps the same fast workflow
            from the original app, but your data now lives in Supabase instead of one browser’s localStorage.
          </p>
          <div className="row-wrap">
            {activeWorkout ? (
              <button className="btn btn-primary" onClick={() => setView('workout')}>Resume Active Workout</button>
            ) : (
              <button className="btn btn-primary" onClick={onStartBlank}><Plus size={16} /> Start Blank Workout</button>
            )}
            <button className="btn btn-outline" onClick={() => setView('templates')}>
              Browse Templates
            </button>
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">Current status</p>
          {activeWorkout ? (
            <div className="stack-md">
              <div>
                <h3>{activeWorkout.name}</h3>
                <p className="muted">{activeWorkout.exercises.length} exercises • {formatDuration(calcWorkoutDuration(activeWorkout, now))}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setView('workout')}>Go to workout</button>
            </div>
          ) : (
            <div className="stack-md">
              <p className="muted">No active workout. Start one in a tap.</p>
              <button className="btn btn-outline" onClick={onStartBlank}>Start now</button>
            </div>
          )}
        </div>
      </section>

      <section className="grid four-up">
        <StatCard label="Completed sessions" value={totalSessions} hint="Per authenticated user" icon={HistoryIcon} />
        <StatCard label="Lifetime volume" value={`${Math.round(totalVolume).toLocaleString()} lb`} hint="Completed work only" icon={BarChart3} />
        <StatCard label="Templates" value={templates.length} hint="Reusable starting points" icon={LayoutTemplate} />
        <StatCard label="Last workout" value={lastWorkout ? formatDateShort(lastWorkout.finishedAt) : '—'} hint={lastWorkout ? lastWorkout.name : 'No history yet'} icon={CheckCircle2} />
      </section>

      <section>
        <SectionHeader title="Quick start templates" subtitle="One tap to get moving." />
        <div className="grid three-up">
          {templates.slice(0, 3).map((template) => (
            <div key={template.id} className="card">
              <h3>{template.name}</h3>
              <p className="muted">{template.notes || `${template.exercises.length} exercises`}</p>
              <div className="chip-wrap">
                {template.exercises.slice(0, 4).map((exercise) => (
                  <span key={exercise.id} className="badge secondary">{exercise.name}</span>
                ))}
              </div>
              <button className="btn btn-primary btn-block" onClick={() => onStartTemplate(template)}>
                Start {template.name}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
