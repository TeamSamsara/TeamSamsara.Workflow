// File : /TeamSamsara.Workflow/app/src/features/availability/ui/TeamHourGrid.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The Hours view of Team availability: a button per hour and day,
// shaded by how many of the people shown are free (bright when everyone is),
// with the count written in it. Clicking one picks that hour for the side
// panel. Nothing depends on hovering.

import { cellTone, FirstHour, type HourCell } from "../model/hourGrid";
import { TeamViewText as Text } from "./teamViewContent";
import styles from "./TeamView.module.css";

interface TeamHourGridProps {
  rows: readonly HourCell[][];
  days: readonly string[];
  /** "7 PM" for an hour of the day. */
  hourLabel: (hour: number) => string;
  picked: { day: number; hour: number };
  onPick: (day: number, hour: number) => void;
  todayIndex: number;
}

export function TeamHourGrid({
  rows,
  days,
  hourLabel,
  picked,
  onPick,
  todayIndex,
}: TeamHourGridProps) {
  return (
    <div
      className={styles.hours}
      role="group"
      aria-label={Text.hoursGrid}
      data-tour="teamGrid"
    >
      <span />
      {days.map((day, index) => (
        <span
          key={day}
          className={styles.hoursDay}
          data-today={index === todayIndex || undefined}
        >
          {day}
        </span>
      ))}
      {rows.map((row, rowIndex) => {
        const hour = FirstHour + rowIndex;
        return [
          <span key={`label-${hour}`} className={styles.hourLabel}>
            {hourLabel(hour)}
          </span>,
          ...row.map((cell, day) => {
            const total = cell.free.length + cell.busy.length;
            const isPicked = picked.day === day && picked.hour === hour;
            return (
              <button
                key={`${hour}-${day}`}
                type="button"
                className={styles.hourCell}
                data-tone={cellTone(cell)}
                data-picked={isPicked || undefined}
                aria-pressed={isPicked}
                aria-label={Text.cell(
                  days[day],
                  hourLabel(hour),
                  cell.free.length,
                  total,
                )}
                onClick={() => onPick(day, hour)}
              >
                {total > 0 && cell.free.length > 0
                  ? `${cell.free.length}/${total}`
                  : ""}
              </button>
            );
          }),
        ];
      })}
    </div>
  );
}
