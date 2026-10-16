"use client";

// An inline <script> that runs during HTML parsing (server render) but is
// inert when React renders it on the client, which would otherwise warn
// "Encountered a script tag while rendering React component".
// See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
