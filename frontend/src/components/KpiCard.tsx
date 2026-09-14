interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'warning' | 'critical' | 'neutral';
  highlight?: boolean;
}

export function KpiCard({ label, value, hint, tone = 'neutral', highlight }: KpiCardProps) {
  return (
    <section className={`metric-card ${highlight ? 'metric-highlight' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small className={`metric-hint metric-hint-${tone}`}>{hint}</small>}
    </section>
  );
}
