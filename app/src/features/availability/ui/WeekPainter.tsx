// File : /TeamSamsara.Workflow/app/src/features/availability/ui/WeekPainter.tsx
// Version : 1.0.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : A member's usual week as a grid of hours (8 AM to midnight) to
// paint: pick Available or Unavailable, then click or drag across hours.

import { useState } from "react";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { WeekPainterText as Text } from "./availabilityContent";
import styles from "./WeekPainter.module.css";

const hours = Array.from({ length: 16 }, (_unused, index) => 8 + index);

interface WeekPainterProps {
  /** Weekday (0 = Sunday) → hours usually unavailable. */
  weekly: Record<number, number[]>;
  onChange: (weekly: Record<number, number[]>) => void;
  /** Weekdays in the workspace's order, with their short names. */
  days: readonly { index: number; name: string }[];
  hourLabel: (hour: number) => string;
}

export function WeekPainter({
  weekly,
  onChange,
  days,
  hourLabel,
}: WeekPainterProps) {
  const [brush, setBrush] = useState<"available" | "unavailable">(
    "unavailable",
  );
  const [isPainting, setIsPainting] = useState(false);

  const isUnavailable = (day: number, hour: number) =>
    (weekly[day] ?? []).includes(hour);
  const free = days.reduce(
    (total, day) =>
      total + hours.filter((hour) => !isUnavailable(day.index, hour)).length,
    0,
  );

  function paint(day: number, hour: number) {
    const current = weekly[day] ?? [];
    const wantUnavailable = brush === "unavailable";
    if (current.includes(hour) === wantUnavailable) return;
    onChange({
      ...weekly,
      [day]: wantUnavailable
        ? [...current, hour].sort((a, b) => a - b)
        : current.filter((entry) => entry !== hour),
    });
  }

  return (
    <div
      className={styles.painter}
      onPointerUp={() => setIsPainting(false)}
      onPointerLeave={() => setIsPainting(false)}
    >
      <div className={styles.toolbar}>
        <SegmentedControl
          label={Text.brush}
          options={[
            { value: "unavailable", label: Text.unavailable },
            { value: "available", label: Text.available },
          ]}
          value={brush}
          onChange={setBrush}
        />
        <span className={styles.total}>{Text.hours(free)}</span>
      </div>
      <p className={styles.help}>{Text.help}</p>
      <div className={styles.scroll}>
        <div className={styles.grid}>
          <span />
          {days.map((day) => (
            <span key={day.index} className={styles.dayName}>
              {day.name}
            </span>
          ))}
          {hours.map((hour) => (
            <div key={hour} className={styles.row}>
              <span className={styles.hour}>{hourLabel(hour)}</span>
              {days.map((day) => {
                const off = isUnavailable(day.index, hour);
                return (
                  <button
                    key={day.index}
                    type="button"
                    className={styles.cell}
                    data-off={off}
                    aria-pressed={off}
                    aria-label={Text.cell(day.name, hourLabel(hour), !off)}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setIsPainting(true);
                      paint(day.index, hour);
                    }}
                    onPointerEnter={() => {
                      if (isPainting) paint(day.index, hour);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        paint(day.index, hour);
                      }
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
