// File : /TeamSamsara.Workflow/app/src/features/events/model/weekLayout.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Where each item sits in a day of the week view, which shows 8 AM
// to midnight: its top and height in minutes, and side by side with the items
// it overlaps. Items over before 8 AM become markers at the top.

export const WeekHours = { from: 8, to: 24 } as const;

const windowStart = WeekHours.from * 60;
const windowEnd = WeekHours.to * 60;
/** The shortest an item is drawn, so a one-off task's line stays readable. */
const shortest = 30;

export interface DaySpan<T> {
  item: T;
  /** Minutes after the day's midnight (may be below 0 if it began the day before). */
  start: number;
  /** Minutes after the day's midnight (may pass 1440 if it ends the next day). */
  end: number;
}

export interface Placed<T> {
  item: T;
  /** Minutes below the top of the view (8 AM). */
  top: number;
  height: number;
  /** Which of the side-by-side columns it takes, from 0. */
  column: number;
  columns: number;
  /** It started before 8 AM or runs past midnight, so the drawn block is cut. */
  cutTop: boolean;
  cutBottom: boolean;
}

export interface DayLayout<T> {
  placed: Placed<T>[];
  /** Over before 8 AM: shown as markers at the top. */
  early: T[];
}

export function layoutDay<T>(spans: readonly DaySpan<T>[]): DayLayout<T> {
  const early = spans
    .filter((span) => span.end <= windowStart)
    .map((span) => span.item);
  const shown = spans
    .filter((span) => span.end > windowStart && span.start < windowEnd)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const placed: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;
  const closeCluster = () => {
    for (const entry of cluster) entry.columns = columnEnds.length;
    cluster = [];
    columnEnds = [];
  };

  for (const span of shown) {
    const start = Math.max(span.start, windowStart);
    const end = Math.max(
      Math.min(span.end, windowEnd),
      Math.min(start + shortest, windowEnd),
    );
    if (start >= clusterEnd) closeCluster();
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else columnEnds[column] = end;
    clusterEnd = cluster.length === 0 ? end : Math.max(clusterEnd, end);
    const entry: Placed<T> = {
      item: span.item,
      top: start - windowStart,
      height: end - start,
      column,
      columns: 1,
      cutTop: span.start < windowStart,
      cutBottom: span.end > windowEnd,
    };
    cluster.push(entry);
    placed.push(entry);
  }
  closeCluster();
  return { placed, early };
}
