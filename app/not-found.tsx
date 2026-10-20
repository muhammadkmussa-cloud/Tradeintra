export default function NotFound() {
  return (
    <section className="not-found">
      <img src="/favicon.svg" alt="" width={42} height={42} />
      <span className="eyebrow">NOT FOUND · 404</span>
      <h1>This page hasn’t launched.</h1>
      <p>
        The address may be incorrect, or this mock site hasn’t been published.
        <br />
        Private drafts are never shown here.
      </p>
      <a className="btn primary" href="/">
        Back to your studio →
      </a>
    </section>
  );
}
