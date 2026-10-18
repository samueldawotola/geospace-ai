import { Fragment } from "react";

// The trip generator (src/lib/llm.ts) wraps the most crucial words in packing
// items, local tips and risk factors in [[double brackets]]. Render those as
// underlines in the time-of-day accent; anything else stays plain text.
const MARK = /\[\[(.+?)\]\]/g;

export function Marked({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MARK)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <u
        key={m.index}
        className="font-medium text-(--tod-card-fg) underline decoration-(--tod-card-accent) decoration-2 underline-offset-[3px]"
      >
        {m[1]}
      </u>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  // Drop any unpaired brackets the model left behind.
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{typeof p === "string" ? p.replace(/\[\[|\]\]/g, "") : p}</Fragment>
      ))}
    </>
  );
}

// Split a paragraph into sentences for bullet points, without breaking on
// abbreviations like "U.S.", "e.g." or "St." that end in a period.
const ABBREVIATION = /(?:^|[\s[(“"])(?:(?:[A-Za-z]\.){2,}|e\.g\.|i\.e\.|etc\.|vs\.|approx\.|St\.|Mt\.|Dr\.|Mr\.|Mrs\.|Ms\.|No\.)$/;

export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (const m of text.matchAll(/[.!?](?=\s+(?:\[\[|["“(])?[A-Z0-9])/g)) {
    const end = m.index + 1;
    const piece = text.slice(start, end);
    if (ABBREVIATION.test(piece)) continue;
    // Never split inside an underlined [[phrase]].
    if ((piece.match(/\[\[/g)?.length ?? 0) > (piece.match(/\]\]/g)?.length ?? 0)) continue;
    out.push(text.slice(start, end).trim());
    start = end;
  }
  const rest = text.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}
