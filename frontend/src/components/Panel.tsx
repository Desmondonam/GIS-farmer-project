import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  note?: string;
  wide?: boolean;
  tall?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, note, wide, tall, actions, children, className }: PanelProps) {
  const classes = ['panel', wide && 'panel-wide', tall && 'panel-tall', className].filter(Boolean).join(' ');
  return (
    <section className={classes}>
      <div className="panel-header panel-header-row">
        <h2>{title}</h2>
        <div className="panel-header-right">
          {note && <span className="panel-note">{note}</span>}
          {actions}
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
