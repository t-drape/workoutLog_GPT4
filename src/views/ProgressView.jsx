import { BarChart3, CheckCircle2, Dumbbell, History } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { formatDateShort } from '../lib/format';

export default function ProgressView({ history, progress }) {
  if (!history.length || !progress.length) {
    return (
      <EmptyState
        title="No progression data yet"
        description="Complete a few workouts with marked sets to unlock exercise PRs, max weight, and volume tracking."
      />
    );
  }

  const totalPRs = progress.filter((item) => item.prRepSet).length;
  const heaviest = progress.reduce((best, item) => (!best || item.maxWeight > best.maxWeight ? item : best), null);

  return (
    <div className="stack-xl">
      <SectionHeader title="Progress" subtitle="Practical lift metrics: PRs, max load, total volume, and recent comparisons." />

      <section className="grid four-up">
        <StatCard label="Tracked exercises" value={progress.length} icon={Dumbbell} />
        <StatCard label="Exercise PRs" value={totalPRs} icon={CheckCircle2} />
        <StatCard label="Heaviest lift" value={heaviest ? `${heaviest.maxWeight} lb` : '—'} hint={heaviest?.name ?? ''} icon={BarChart3} />
        <StatCard label="Completed workouts" value={history.length} icon={History} />
      </section>

      <div className="grid two-up">
        {progress.map((item) => {
          const deltaVolume = item.latest && item.previous ? item.latest.volume - item.previous.volume : null;
          return (
            <div key={item.name} className="card stack-md">
              <div className="row-between wrap-gap">
                <div>
                  <h3>{item.name}</h3>
                  <p className="muted">{item.sessionCount} logged sessions</p>
                </div>
                <span className="badge">Max {item.maxWeight} lb</span>
              </div>

              <div className="grid three-up compact-grid">
                <div className="sub-card">
                  <p className="eyebrow">Best volume</p>
                  <p className="stat-value">{Math.round(item.bestVolume).toLocaleString()} lb</p>
                </div>
                <div className="sub-card">
                  <p className="eyebrow">Lifetime volume</p>
                  <p className="stat-value">{Math.round(item.totalVolume).toLocaleString()} lb</p>
                </div>
                <div className="sub-card">
                  <p className="eyebrow">Recent change</p>
                  <p className={deltaVolume === null ? 'stat-value' : deltaVolume >= 0 ? 'stat-value good' : 'stat-value warn'}>
                    {deltaVolume === null ? '—' : `${deltaVolume >= 0 ? '+' : ''}${Math.round(deltaVolume)} lb`}
                  </p>
                </div>
              </div>

              {item.prRepSet ? (
                <div className="sub-card">
                  <strong>Top set</strong>
                  <p className="muted small">{item.prRepSet.weight} lb • {item.prRepSet.reps} reps</p>
                </div>
              ) : null}

              <div className="stack-sm">
                <strong>Recent sessions</strong>
                {item.sessions.slice(0, 3).map((session) => (
                  <div key={session.sessionId} className="mini-card row-between wrap-gap">
                    <div>
                      <strong>{formatDateShort(session.date)}</strong>
                      <p className="muted small">{session.sessionName}</p>
                    </div>
                    <div className="right-text">
                      <strong>{session.maxWeight} lb</strong>
                      <p className="muted small">{Math.round(session.volume).toLocaleString()} lb volume</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
