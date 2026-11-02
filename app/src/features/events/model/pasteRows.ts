// File : /TeamSamsara.Workflow/app/src/features/events/model/pasteRows.ts
// Version : 1.0.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : Rows pasted from a spreadsheet (Google Sheets, Excel, a league's
// schedule) turned into planned events. Splits the text into cells, guesses
// what each column is (a date, a start, an end, one of the {gaps}) and reads
// dates and times written many ways: "2027-01-09", "1/9/2027", "Sat Jan 9",
// "9 janv. 2027", "5:00 PM", "17h30", "5 – 7 PM". "TBD" and the like leave a
// gap empty, to fill in later.

import { addDays } from "./repeatRule";
import type { PlanRow } from "./planDraft";

/** What a pasted column holds: nothing to use, when, or a gap's value. */
export type ColumnKind = "ignore" | "date" | "start" | "end" | `gap:${string}`;

export const gapColumn = (gap: string): ColumnKind => `gap:${gap}`;

export interface ReadOptions {
  /** Today, "2026-11-01", to put a year on dates written without one. */
  today: string;
  /** Read 3/4 as April 3rd (the workspace writes the day first). */
  dayFirst: boolean;
}

const pad = (value: number) => String(value).padStart(2, "0");

// #region Splitting
/** One CSV line, honouring "quoted, cells". */
function splitDelimited(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.trim() === "") {
      quoted = true;
      cell = "";
    } else if (char === delimiter) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

/**
 * The pasted text as rows of cells. Spreadsheets copy with tabs; a CSV uses
 * commas or semicolons. Empty lines are dropped.
 */
export function splitTable(text: string): string[][] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];
  const delimiter = lines.some((line) => line.includes("\t"))
    ? "\t"
    : lines.every((line) => line.includes(";")) &&
        !lines.every((line) => line.includes(","))
      ? ";"
      : lines.every((line) => line.includes(","))
        ? ","
        : null;
  const rows = lines.map((line) =>
    delimiter ? splitDelimited(line, delimiter) : [line.trim()],
  );
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => [
    ...row,
    ...Array.from({ length: width - row.length }, () => ""),
  ]);
}
// #endregion

// #region Reading values
/** Words that mean "not known yet". */
export function isUnknown(value: string): boolean {
  return /^(tbd|tba|tbc|à venir|a venir|n\/a|\?+|-+|–|—)$/i.test(value.trim());
}

const months: readonly [string, number][] = [
  ["janv", 1],
  ["jan", 1],
  ["feb", 2],
  ["fev", 2],
  ["mar", 3],
  ["apr", 4],
  ["avr", 4],
  ["may", 5],
  ["mai", 5],
  ["juin", 6],
  ["jun", 6],
  ["juil", 7],
  ["jul", 7],
  ["aug", 8],
  ["aou", 8],
  ["sep", 9],
  ["oct", 10],
  ["nov", 11],
  ["dec", 12],
];

const plain = (word: string) =>
  word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function monthOf(word: string): number | null {
  const lower = plain(word).replace(/\.$/, "");
  if (lower.length < 3) return null;
  return months.find(([start]) => lower.startsWith(start))?.[1] ?? null;
}

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * A date without a year is the next one from about two months ago, so a
 * schedule pasted in December for January lands next year.
 */
function withYear(
  month: number,
  day: number,
  year: number | null,
  today: string,
): string | null {
  const fullYear = year === null ? null : year < 100 ? 2000 + year : year;
  if (fullYear !== null)
    return isRealDate(fullYear, month, day)
      ? `${fullYear}-${pad(month)}-${pad(day)}`
      : null;
  const thisYear = Number(today.slice(0, 4));
  const earliest = addDays(today, -60);
  for (const candidate of [thisYear, thisYear + 1]) {
    const key = `${candidate}-${pad(month)}-${pad(day)}`;
    if (isRealDate(candidate, month, day) && key >= earliest) return key;
  }
  return null;
}

/** The date in a cell, as "2027-01-09"; null when there's none. */
export function readDate(text: string, options: ReadOptions): string | null {
  const iso = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (iso)
    return withYear(
      Number(iso[2]),
      Number(iso[3]),
      Number(iso[1]),
      options.today,
    );

  const numeric =
    /(?<![\d:])(\d{1,2})([/.-])(\d{1,2})(?:\2(\d{2}|\d{4}))?(?![\d:])/.exec(
      text,
    );
  // "5.30" or "3-4" alone are too likely to be something else.
  if (numeric && (numeric[2] === "/" || numeric[4] !== undefined)) {
    let first = Number(numeric[1]);
    let second = Number(numeric[3]);
    if (first > 12 && second <= 12) [first, second] = [second, first];
    else if (options.dayFirst && second <= 12)
      [first, second] = [second, first];
    const year = numeric[4] === undefined ? null : Number(numeric[4]);
    return withYear(first, second, year, options.today);
  }

  const words = text.replace(/[,()]/g, " ").split(/\s+/).filter(Boolean);
  const monthIndex = words.findIndex((word) => monthOf(word) !== null);
  if (monthIndex === -1) return null;
  const month = monthOf(words[monthIndex]) ?? 0;
  const dayAt = (word: string | undefined) => {
    const match = /^(\d{1,2})(?:st|nd|rd|th|er|e)?\.?$/i.exec(word ?? "");
    const day = match ? Number(match[1]) : NaN;
    return day >= 1 && day <= 31 ? day : null;
  };
  // "Jan 9" or "9 Jan"; the number right after the month wins.
  const day = dayAt(words[monthIndex + 1]) ?? dayAt(words[monthIndex - 1]);
  if (day === null) return null;
  const yearWord = words.find((word) => /^\d{4}$/.test(word));
  return withYear(
    month,
    day,
    yearWord ? Number(yearWord) : null,
    options.today,
  );
}

/**
 * The times in a cell, as "17:00", in order: "5:00 PM", "17:00", "17h30",
 * "5pm", and ranges like "5 – 7 PM" (the PM counts for both).
 */
export function readTimes(cell: string): string[] {
  // Dates written with numbers aren't times; blank them out first.
  const text = cell
    .replace(/\d{4}-\d{1,2}-\d{1,2}/g, (date) => " ".repeat(date.length))
    .replace(/\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/g, (date) =>
      " ".repeat(date.length),
    )
    .replace(/\d{1,2}\/\d{1,2}/g, (date) => " ".repeat(date.length));
  const pattern =
    /(?<![\d:/.])(\d{1,2})(?:\s*(:|h)\s*(\d{2})?)?\s*(a\.?m\.?|p\.?m\.?|a|p)?(?![\da-z])/gi;
  const found: {
    hour: number;
    minute: number;
    half: string | null;
    start: number;
    end: number;
  }[] = [];
  for (const match of text.matchAll(pattern)) {
    const [whole, hourText, separator, minuteText, halfText] = match;
    const half = halfText ? halfText[0].toLowerCase() : null;
    const hour = Number(hourText);
    const minute = minuteText ? Number(minuteText) : 0;
    if (minute > 59) continue;
    if (half ? hour < 1 || hour > 12 : hour > 23) continue;
    found.push({
      hour,
      minute,
      // A bare number ("9", "Week 1") isn't a time on its own.
      half: separator || half ? half : "bare",
      start: match.index,
      end: match.index + whole.length,
    });
  }
  const times: string[] = [];
  found.forEach((time, index) => {
    let { half } = time;
    if (half === "bare") {
      // "5 – 7 PM": a bare hour starting a range takes the end's AM/PM.
      const next = found[index + 1];
      const between = next ? text.slice(time.end, next.start) : "";
      if (
        !next ||
        next.half === "bare" ||
        next.half === null ||
        !/^\s*(-|–|—|to|à)\s*$/i.test(between)
      )
        return;
      half = next.half;
    }
    let hour = time.hour;
    if (half === "p" && hour < 12) hour += 12;
    if (half === "a" && hour === 12) hour = 0;
    times.push(`${pad(hour)}:${pad(time.minute)}`);
  });
  return times;
}
// #endregion

// #region Columns
const headerWords: readonly [RegExp, ColumnKind][] = [
  [/^(date|day|jour|when|quand)$/, "date"],
  [/^(time|start|starts|start time|heure|debut|kick ?off)$/, "start"],
  [/^(end|ends|end time|fin)$/, "end"],
];

function headerKind(cell: string, gaps: readonly string[]): ColumnKind | null {
  const word = plain(cell).trim().replace(/[{}]/g, "");
  const gap = gaps.find(
    (name) =>
      plain(name) === word || plain(name).replace(/[_-]/g, " ") === word,
  );
  if (gap) return gapColumn(gap);
  return headerWords.find(([pattern]) => pattern.test(word))?.[1] ?? null;
}

export interface ColumnGuess {
  kinds: ColumnKind[];
  /** The first row names the columns instead of being an event. */
  hasHeader: boolean;
}

/** What each column most likely is. */
export function guessColumns(
  table: readonly string[][],
  gaps: readonly string[],
  options: ReadOptions,
): ColumnGuess {
  const width = table[0]?.length ?? 0;
  const datesIn = (row: readonly string[]) =>
    row.filter((cell) => readDate(cell, options)).length;
  const hasHeader =
    table.length > 1 &&
    datesIn(table[0]) === 0 &&
    table.slice(1).some((row) => datesIn(row) > 0);
  const body = hasHeader ? table.slice(1) : table;
  const kinds: ColumnKind[] = Array.from({ length: width }, () => "ignore");
  const used = new Set<ColumnKind>();

  if (hasHeader)
    table[0].forEach((cell, column) => {
      const kind = headerKind(cell, gaps);
      if (kind && !used.has(kind)) {
        kinds[column] = kind;
        used.add(kind);
      }
    });

  const share = (column: number, test: (cell: string) => boolean) => {
    const cells = body
      .map((row) => row[column] ?? "")
      .filter((cell) => cell.trim() && !isUnknown(cell));
    return cells.length === 0 ? 0 : cells.filter(test).length / cells.length;
  };
  for (let column = 0; column < width; column += 1) {
    if (kinds[column] !== "ignore") continue;
    if (
      !used.has("date") &&
      share(column, (cell) => !!readDate(cell, options)) >= 0.5
    ) {
      kinds[column] = "date";
      used.add("date");
    } else if (share(column, (cell) => readTimes(cell).length > 0) >= 0.5) {
      const kind = !used.has("start")
        ? "start"
        : !used.has("end")
          ? "end"
          : null;
      if (kind) {
        kinds[column] = kind;
        used.add(kind);
      }
    }
  }
  // The other columns with something in them fill the gaps in order.
  const open = gaps.filter((gap) => !used.has(gapColumn(gap)));
  for (let column = 0; column < width && open.length > 0; column += 1) {
    if (kinds[column] !== "ignore") continue;
    if (body.every((row) => !(row[column] ?? "").trim())) continue;
    const gap = open.shift();
    if (gap) kinds[column] = gapColumn(gap);
  }
  return { kinds, hasHeader };
}
// #endregion

// #region Rows
export interface PastedRows {
  rows: Omit<PlanRow, "key">[];
  /** Line numbers (from 1) with no date that could be read. */
  skipped: number[];
  /** Gaps left empty because the sheet said TBD (or left them blank). */
  unknown: number;
}

const toMinutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const fromMinutes = (total: number) => {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
};

/** The pasted rows as plan rows, with the usual times where none is given. */
export function readPasted(
  table: readonly string[][],
  guess: ColumnGuess,
  usual: { time: string; endTime: string },
  options: ReadOptions,
): PastedRows {
  const length =
    (toMinutes(usual.endTime) - toMinutes(usual.time) + 1440) % 1440 || 1440;
  const rows: Omit<PlanRow, "key">[] = [];
  const skipped: number[] = [];
  let unknown = 0;
  const column = (kind: ColumnKind) => guess.kinds.indexOf(kind);
  const dateColumn = column("date");
  const startColumn = column("start");
  const endColumn = column("end");

  table.forEach((cells, index) => {
    if (guess.hasHeader && index === 0) return;
    const dateCell = dateColumn === -1 ? "" : (cells[dateColumn] ?? "");
    const date = readDate(dateCell, options);
    if (!date) {
      skipped.push(index + 1);
      return;
    }
    const startTimes =
      startColumn === -1 ? [] : readTimes(cells[startColumn] ?? "");
    const dateTimes = readTimes(dateCell);
    const endTimes = endColumn === -1 ? [] : readTimes(cells[endColumn] ?? "");
    const time = startTimes[0] ?? dateTimes[0] ?? usual.time;
    const endTime =
      endTimes[0] ??
      startTimes[1] ??
      (startTimes[0] ? undefined : dateTimes[1]) ??
      fromMinutes(toMinutes(time) + length);
    const values: Record<string, string> = {};
    guess.kinds.forEach((kind, at) => {
      if (!kind.startsWith("gap:")) return;
      const value = (cells[at] ?? "").trim();
      if (!value || isUnknown(value)) {
        unknown += 1;
        return;
      }
      values[kind.slice(4)] = value;
    });
    rows.push({ date, time, endTime, values });
  });
  return { rows, skipped, unknown };
}
// #endregion
