// File : /TeamSamsara.Workflow/app/src/features/availability/ui/UsualWeekStrip.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Someone's week at a glance: a cell per day with when they're free
// (8 AM to midnight in the zone shown), "Unavailable" when they're not, or
// "Not filled in". Used on member profiles.

import { useMemo } from "react";
import { formatTime, type ClockFormat } from "@/shared/time/dates";
import type { WeekDay } from "@/shared/time/weekGrid";
import { toWallTime } from "@/shared/time/zonedTime";
import { freeStretches } from "../model/hourGrid";
import type { BusyBlock } from "../model/freeBusy";
import type { AvailabilityRecord } from "../types/availabilityTypes";
import { TeamViewText as Text } from "./teamViewContent";
import styles from "./TeamView.module.css";

interface UsualWeekStripProps {
  availability: AvailabilityRecord | null;
  busy?: readonly BusyBlock[];
  days: readonly WeekDay[];
  dayNames: readonly string[];
  timeZone: string;
  clock: ClockFormat;
}

export function UsualWeekStrip({
  availability,
  busy = [],
  days,
  dayNames,
  timeZone,
  clock,
}: UsualWeekStripProps) {
  const cells = useMemo(
    () =>
      days.map((day) => {
        if (!availability)
          return { kind: "unknown" as const, text: Text.notFilledLabel };
        const short = (date: Date) => {
          const wall = toWallTime(date, timeZone);
          return wall.minute === 0 && clock === "12h"
            ? `${wall.hour % 12 || 12} ${wall.hour % 24 < 12 ? "AM" : "PM"}`
            : formatTime(date, timeZone, clock);
        };
        const free = freeStretches({ availability, busy }, day, timeZone);
        if (free.length === 0)
          return { kind: "unavailable" as const, text: Text.unavailable };
        return {
          kind: "free" as const,
          text: free
            .map((stretch) => `${short(stretch.start)} – ${short(stretch.end)}`)
            .join(", "),
        };
      }),
    [availability, busy, days, timeZone, clock],
  );

  return (
    <div className={styles.strip}>
      {cells.map((cell, index) => (
        <div key={days[index].key} className={styles.stripDay}>
          <span className={styles.stripName}>{dayNames[index]}</span>
          <span className={styles.stripCell} data-kind={cell.kind}>
            {cell.text}
          </span>
        </div>
      ))}
    </div>
  );
}
