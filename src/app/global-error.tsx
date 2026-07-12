"use client";

/**
 * Catches errors thrown in the root layout itself. It replaces the whole
 * document, so it must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Application error
        </h1>
        <p>A critical error occurred. Please try again.</p>
        {error.digest ? <p>Reference: {error.digest}</p> : null}
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: "0.5rem",
            border: "1px solid currentColor",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
