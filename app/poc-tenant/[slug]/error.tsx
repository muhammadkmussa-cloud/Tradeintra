"use client";
export default function StagingTenantError({ reset }: { reset: () => void }) {
  return (
    <section className="poc-unavailable" role="alert">
      <h1>Staging tenant unavailable</h1>
      <p>
        The database or staging configuration is not ready. No draft or fallback
        tenant data is displayed.
      </p>
      <p>This is not a production trading service.</p>
      <button className="btn" onClick={reset}>
        Retry staging check
      </button>
    </section>
  );
}
