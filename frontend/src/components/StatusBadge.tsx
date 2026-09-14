import type { CSSProperties } from 'react';
import { statusColor } from '../theme';

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const color = statusColor(value);
  const style = { '--badge-color': color } as CSSProperties;
  return (
    <span className="status-badge" style={style}>
      <span className="status-dot" aria-hidden="true" />
      {label ?? value.replace(/_/g, ' ')}
    </span>
  );
}
