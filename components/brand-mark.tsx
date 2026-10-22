import Link from "next/link";

const T_PATH =
  "M316.5 322.9 L946.5 235.3 L834.9 385.7 L634 414 L635 733 L464 897 L464 434.9 L201 472 Z";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      viewBox="0 0 1084 1084"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="brand-mark-tile" width="1084" height="1084" />
      <path className="brand-mark-glyph" d={T_PATH} />
    </svg>
  );
}

export function BrandWordmark({
  className = "",
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const content = (
    <>
      <BrandMark />
      <span className="brand-word" aria-label="tradeintra">
        <span className="brand-word-trade">trade</span>
        <span className="brand-word-intra">intra</span>
      </span>
    </>
  );
  if (!href)
    return (
      <span className={`brand-wordmark ${className}`.trim()}>{content}</span>
    );
  return (
    <Link
      className={`brand-wordmark ${className}`.trim()}
      href={href}
      aria-label="Tradeintra home"
    >
      {content}
    </Link>
  );
}
