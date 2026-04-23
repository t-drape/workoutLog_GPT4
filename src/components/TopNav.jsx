import { BarChart3, Dumbbell, History, LayoutTemplate, LogOut } from 'lucide-react';
import { signOut } from '../services/auth';

const items = [
  { key: 'dashboard', label: 'Home', icon: Dumbbell },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate },
  { key: 'history', label: 'History', icon: History },
  { key: 'progress', label: 'Progress', icon: BarChart3 },
];

export default function TopNav({ view, setView, activeWorkout, user }) {
  return (
    <div className="topnav-wrap">
      <div className="topnav-inner">
        <div className="brand">
          <div className="brand-icon"><Dumbbell size={20} /></div>
          <div>
            <h1>LiftLog</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="nav-actions">
          {activeWorkout ? (
            <button className="btn btn-primary" onClick={() => setView('workout')}>
              Active Workout
            </button>
          ) : null}
          <button className="btn btn-ghost" onClick={signOut}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div className="nav-grid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={view === item.key ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={16} /> {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
