// File : /TeamSamsara.Workflow/app/src/features/events/ui/CalendarMonth.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : The month grid: weekday names, then a cell per day with its number
// (today marked, other months' days faded), what's on that day, and for
// planners a "+" to plan an event on it.

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MonthGrid } from "@/shared/time/monthGrid";
import { Icon } from "@/shared/icons/Icon";
import { CalendarText as Text } from "./eventsContent";
import styles from "./CalendarMonth.module.css";

interface CalendarMonthProps {
  grid: MonthGrid;
  weekStartsOn: "monday" | "sunday";
  /** What's on a day ("2026-11-09"). */
  itemsFor: (dayKey: string) => ReactNode[];
  /** Where "+" goes for a day; leave out for people who can't plan events. */
  addHref?: (dayKey: string) => string;
  /** "Mon, Nov 9", for the "+" button's label. */
  dayLabel: (dayKey: string) => string;
}

export function CalendarMonth({
  grid,
  weekStartsOn,
  itemsFor,
  addHref,
  dayLabel,
}: CalendarMonthProps) {
  return (
    <div className={styles.month} role="grid" aria-readonly="true">
      <div className={styles.weekdays} role="row">
        {Text.weekdays[weekStartsOn].map((name) => (
          <span key={name} className={styles.weekday} role="columnheader">
            {name}
          </span>
        ))}
      </div>
      {grid.weeks.map((week) => (
        <div key={week[0].key} className={styles.week} role="row">
          {week.map((day) => {
            const items = itemsFor(day.key);
            return (
              <div
                key={day.key}
                className={styles.day}
                role="gridcell"
                data-in-month={day.inMonth}
                data-today={day.isToday}
                aria-label={dayLabel(day.key)}
              >
                <div className={styles.dayHeader}>
                  <span className={styles.number}>{day.day}</span>
                  {addHref ? (
                    <Link
                      to={addHref(day.key)}
                      className={styles.add}
                      aria-label={Text.addOn(dayLabel(day.key))}
                    >
                      <Icon name="add" />
                    </Link>
                  ) : null}
                </div>
                {items.length > 0 ? (
                  <div className={styles.items}>{items}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
