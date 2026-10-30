// File : /TeamSamsara.Workflow/app/src/features/events/ui/CalendarList.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : The month as a list of days that have something on them, each
// with its items; the easy view on a phone.

import type { ReactNode } from "react";
import { CalendarText as Text } from "./eventsContent";
import styles from "./CalendarList.module.css";

interface CalendarListProps {
  /** Days in order ("2026-11-09"). */
  dayKeys: readonly string[];
  itemsFor: (dayKey: string) => ReactNode[];
  dayLabel: (dayKey: string) => string;
  todayKey: string;
}

export function CalendarList({
  dayKeys,
  itemsFor,
  dayLabel,
  todayKey,
}: CalendarListProps) {
  const days = dayKeys
    .map((key) => ({ key, items: itemsFor(key) }))
    .filter((day) => day.items.length > 0);
  if (days.length === 0)
    return <p className={styles.empty}>{Text.emptyList}</p>;

  return (
    <ol className={styles.list}>
      {days.map((day) => (
        <li
          key={day.key}
          className={styles.day}
          data-today={day.key === todayKey}
        >
          <h2 className={styles.heading}>
            {dayLabel(day.key)}
            {day.key === todayKey ? (
              <span className={styles.today}>{Text.today}</span>
            ) : null}
          </h2>
          <div className={styles.items}>{day.items}</div>
        </li>
      ))}
    </ol>
  );
}
