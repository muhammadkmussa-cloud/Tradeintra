"use client";
export default function StagingTenantError({ reset }: { reset: () => void }) {
  return (
    <section className="poc-unavailable" role="alert">
      <h1>Mock site unavailable</h1>
      <p>
        The database or staging configuration is not ready. No draft or fallback
        tenant data is displayed.
      </p>
      <p>This is a mock preview, not a trading service.</p>
      <button className="btn" onClick={reset}>
        Retry mock preview
      </button>
    </section>
  );
}
