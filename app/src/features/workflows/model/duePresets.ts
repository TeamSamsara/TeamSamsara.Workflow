// File : /TeamSamsara.Workflow/app/src/features/workflows/model/duePresets.ts
// Version : 1.0.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : The due times people pick most, offered first so choosing one is a
// single click; anything else is "Custom". Also turns a due time into an
// amount and unit ("36 hours") and back, for the custom fields.

import {
  atTheStart,
  WorkflowLimits,
  type DueOffset,
} from "../types/workflowTypes";

export interface DuePreset {
  id: string;
  offset: DueOffset;
  /** Counted in whole days, so it can also take a time of day. */
  inDays: boolean;
}

const offset = (
  direction: DueOffset["direction"],
  days: number,
  hours: number,
): DueOffset => ({ direction, days, hours, minutes: 0, time: null });

export const DuePresets: readonly DuePreset[] = [
  { id: "start", offset: atTheStart, inDays: false },
  { id: "1h-before", offset: offset("before", 0, 1), inDays: false },
  { id: "3h-before", offset: offset("before", 0, 3), inDays: false },
  { id: "1d-before", offset: offset("before", 1, 0), inDays: true },
  { id: "2d-before", offset: offset("before", 2, 0), inDays: true },
  { id: "1w-before", offset: offset("before", 7, 0), inDays: true },
  { id: "1h-after", offset: offset("after", 0, 1), inDays: false },
  { id: "1d-after", offset: offset("after", 1, 0), inDays: true },
];

/** The preset a due time is, if any. A day preset matches at any time of day. */
export function matchPreset(due: DueOffset): DuePreset | null {
  return (
    DuePresets.find((preset) => {
      const target = preset.offset;
      if (target.direction !== due.direction) return false;
      if (target.direction === "at") return true;
      return (
        target.days === due.days &&
        target.hours === due.hours &&
        target.minutes === due.minutes &&
        (preset.inDays || due.time === null)
      );
    }) ?? null
  );
}

export const DueUnits = ["minutes", "hours", "days"] as const;
export type DueUnit = (typeof DueUnits)[number];

export interface DueAmount {
  amount: number;
  unit: DueUnit;
}

/** A due time as one amount: "2 days", "36 hours", "90 minutes". */
export function toAmount(due: DueOffset): DueAmount {
  if (due.time !== null || (due.hours === 0 && due.minutes === 0)) {
    return { amount: due.days, unit: "days" };
  }
  const hours = due.days * 24 + due.hours;
  if (due.minutes === 0) return { amount: hours, unit: "hours" };
  return { amount: hours * 60 + due.minutes, unit: "minutes" };
}

/** The most of each unit (the same span as WorkflowLimits.dueDays). */
export const maxAmount: Record<DueUnit, number> = {
  days: WorkflowLimits.dueDays,
  hours: WorkflowLimits.dueDays * 24,
  minutes: 24 * 60,
};

/** Back from an amount to a due time; a time of day only goes with days. */
export function fromAmount(
  { amount, unit }: DueAmount,
  direction: "before" | "after",
  time: string | null,
): DueOffset {
  const whole = Math.min(Math.max(Math.trunc(amount) || 0, 0), maxAmount[unit]);
  if (unit === "days") {
    return { direction, days: whole, hours: 0, minutes: 0, time };
  }
  const totalMinutes = unit === "hours" ? whole * 60 : whole;
  return {
    direction,
    days: Math.floor(totalMinutes / (24 * 60)),
    hours: Math.floor(totalMinutes / 60) % 24,
    minutes: totalMinutes % 60,
    time: null,
  };
}

/** Times of day to pick from, every half hour, as "HH:MM". */
export function halfHours(): string[] {
  return Array.from({ length: 48 }, (_unused, index) => {
    const hour = String(Math.floor(index / 2)).padStart(2, "0");
    return `${hour}:${index % 2 === 0 ? "00" : "30"}`;
  });
}
