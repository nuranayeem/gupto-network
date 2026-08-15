export default function AuthLoading() {
  return (
    <main className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-loading-card card" role="status" aria-live="polite">
        <span className="auth-spinner" aria-hidden="true" />
        <strong>Loading Gupto…</strong>
      </div>
    </main>
  );
}
