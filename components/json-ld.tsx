/**
 * Injects a JSON-LD structured-data block (schema.org) for search engines.
 * `<` is escaped so the payload can't break out of the <script> element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
