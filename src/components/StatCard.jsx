export default function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="card stat-card">
      <div>
        <p className="eyebrow">{label}</p>
        <p className="stat-value">{value}</p>
        {hint ? <p className="muted small">{hint}</p> : null}
      </div>
      {Icon ? <div className="icon-badge"><Icon size={18} /></div> : null}
    </div>
  );
}
