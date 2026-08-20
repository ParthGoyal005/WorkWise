export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      {label ? <p className="spinner-label">{label}</p> : null}
    </div>
  );
}
