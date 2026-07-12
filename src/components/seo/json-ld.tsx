import type { Thing, WithContext } from "schema-dts";

interface JsonLdProps {
  /** One or more schema.org graphs to embed as `application/ld+json`. */
  data: WithContext<Thing> | Array<WithContext<Thing>>;
}

/**
 * Server-rendered structured data. Rendering a plain <script> in the server
 * tree (not via next/script) keeps it in the initial HTML with zero client JS,
 * which is exactly what crawlers and AI answer engines parse.
 *
 * `JSON.stringify` output is safe here: it escapes the payload and we control
 * the input (no user-supplied HTML is interpolated).
 */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
