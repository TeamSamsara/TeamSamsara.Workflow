// File : /TeamSamsara.Workflow/app/src/features/events/ui/CalendarWeek.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : The week view: seven days side by side, 8 AM to midnight, each
// item a block from its start to its end, overlapping ones side by side, a line
// at the current time, and anything over before 8 AM as a marker at the top.

import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import type { WeekDay } from "@/shared/time/weekGrid";
import { Icon } from "@/shared/icons/Icon";
import { layoutDay, WeekHours } from "../model/weekLayout";
import { CalendarText as Text } from "./eventsContent";
import styles from "./CalendarWeek.module.css";

/** Pixels per hour. */
const hourHeight = 48;

export interface WeekEntry {
  id: string;
  start: Date;
  end: Date;
  /**
   * Draws the item; with a layout it's a positioned block (compact when it's
   * an hour or less, so its title and time each take one line), without it's
   * a small marker.
   */
  render: (layout: CSSProperties | null, compact?: boolean) => ReactNode;
}

interface CalendarWeekProps {
  days: readonly WeekDay[];
  entriesFor: (dayKey: string) => WeekEntry[];
  now: Date;
  /** A planner's link to a new event on that day. */
  addHref?: (dayKey: string) => string;
  dayLabel: (dayKey: string) => string;
  weekdayNames: readonly string[];
  /** "8 AM" for each hour shown. */
  hourLabel: (hour: number) => string;
}

const minutesInto = (date: Date, day: WeekDay) =>
  (date.getTime() - day.start.getTime()) / 60_000;

export function CalendarWeek({
  days,
  entriesFor,
  now,
  addHref,
  dayLabel,
  weekdayNames,
  hourLabel,
}: CalendarWeekProps) {
  const hours = Array.from(
    { length: WeekHours.to - WeekHours.from },
    (_unused, index) => WeekHours.from + index,
  );
  const scale = hourHeight / 60;
  const layouts = days.map((day) =>
    layoutDay(
      entriesFor(day.key).map((entry) => ({
        item: entry,
        start: minutesInto(entry.start, day),
        end: minutesInto(entry.end, day),
      })),
    ),
  );

  return (
    <div
      className={styles.week}
      style={{ "--hour-height": `${hourHeight}px` } as CSSProperties}
    >
      <div className={styles.head}>
        <span className={styles.corner} />
        {days.map((day, index) => {
          const layout = layouts[index];
          return (
            <div
              key={day.key}
              className={styles.dayHead}
              data-today={day.isToday}
            >
              <div className={styles.dayTitle}>
                <span className={styles.weekday}>{weekdayNames[index]}</span>
                <span className={styles.dayNumber}>{day.day}</span>
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
              {layout.early.length > 0 ? (
                <div className={styles.early} aria-label={Text.earlier}>
                  {layout.early.map((entry) => (
                    <div key={entry.id}>{entry.render(null)}</div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={styles.body}>
        <div className={styles.hours} aria-hidden>
          {hours.map((hour) => (
            <span key={hour} className={styles.hour}>
              {hourLabel(hour)}
            </span>
          ))}
        </div>
        {days.map((day, index) => {
          const { placed } = layouts[index];
          const nowMinutes = minutesInto(now, day) - WeekHours.from * 60;
          const showNow =
            day.isToday &&
            nowMinutes >= 0 &&
            nowMinutes <= (WeekHours.to - WeekHours.from) * 60;
          return (
            <div
              key={day.key}
              className={styles.day}
              data-today={day.isToday}
              aria-label={dayLabel(day.key)}
              role="group"
            >
              {placed.map((entry) => (
                <div key={entry.item.id} className={styles.slot}>
                  {entry.item.render(
                    {
                      position: "absolute",
                      top: `${entry.top * scale}px`,
                      height: `${entry.height * scale - 2}px`,
                      left: `calc(${(entry.column / entry.columns) * 100}% + 3px)`,
                      width: `calc(${100 / entry.columns}% - 6px)`,
                    },
                    entry.height <= 60,
                  )}
                </div>
              ))}
              {showNow ? (
                <span
                  className={styles.now}
                  style={{ top: `${nowMinutes * scale}px` }}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
