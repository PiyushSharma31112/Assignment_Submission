export function Icon({ name }) {
  const icons = {
    dashboard: '▦', assignments: '▤', submissions: '▣', results: '▥',
    students: '♙', profile: '◉', logout: '↪', upload: '↑', check: '✓',
    clock: '◷', book: '▣', search: '⌕', file: '▧',
  };
  return <span className="icon" aria-hidden="true">{icons[name] || '•'}</span>;
}

export function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}>
    <span className="brand-mark">▣</span><span>Assign<span>Hub</span></span>
  </div>;
}

export function Avatar({ name = 'User' }) {
  const initials = name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return <div className="avatar" aria-label={name}>{initials}</div>;
}

export function StatusBadge({ status }) {
  const label = status || 'Pending';
  return <span className={`status status-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</span>;
}

export function SectionTitle({ title, subtitle, action, onAction }) {
  return <div className="section-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
    {action && <button className="text-action" onClick={onAction}>{action} <span>→</span></button>}
  </div>;
}

export function StatCard({ icon, label, value, trend, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon} /></div>
    <div className="stat-content"><span>{label}</span><strong>{value}</strong>
      <small className={trend?.startsWith('+') ? 'trend-up' : ''}>{trend}</small>
    </div><div className="stat-spark">⌁</div>
  </div>;
}

export function EmptyState({ text }) {
  return <div className="empty-state"><div>▤</div><h3>Nothing here yet</h3><p>{text}</p></div>;
}
