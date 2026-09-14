export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state-block state-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-block state-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ label = 'No records match these filters.' }: { label?: string }) {
  return <div className="state-block state-empty">{label}</div>;
}
