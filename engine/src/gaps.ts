// File : /TeamSamsara.Workflow/engine/src/gaps.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Fields written in text, like {title} or {opponent}: finding them,
// filling them, and the ones every event fills on its own.

/** Fields every event fills itself, from its own title, time, link and type. */
export const BuiltInFieldKeys = [
  "title",
  "date",
  "time",
  "end_time",
  "link",
  "event_type",
] as const;
export type BuiltInFieldKey = (typeof BuiltInFieldKeys)[number];

/** "co_streamer" → "Co streamer", for a field with no name of its own. */
export function nameFromKey(key: string): string {
  const words = key.replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const gapPattern = /\{([A-Za-z][A-Za-z0-9_-]{0,29})\}/g;

/** The gaps in a text, lower-cased, each once, in the order they appear. */
export function findGaps(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(gapPattern)) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}

/** Fills the gaps it has values for; leaves any others as they are. */
export function fillGaps(
  text: string,
  values: Readonly<Record<string, string>>,
): string {
  return text.replace(gapPattern, (whole, name: string) => {
    const value = values[name.toLowerCase()];
    return value === undefined ? whole : value;
  });
}
