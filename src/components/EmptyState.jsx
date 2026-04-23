import { Dumbbell } from 'lucide-react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="card empty-state">
      <div className="icon-badge large"><Dumbbell size={24} /></div>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}
