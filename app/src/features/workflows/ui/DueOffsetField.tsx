// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/DueOffsetField.tsx
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : Picks when a task is due, counted from the event's start: before,
// at or after it, by days and hours, or days and a set clock time.

import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import type { ClockFormat } from "@/shared/time/dates";
import { describeDue } from "../model/dueOffset";
import {
  atTheStart,
  DueDirections,
  WorkflowLimits,
  type DueDirection,
  type DueOffset,
} from "../types/workflowTypes";
import { DueFieldText as Text } from "./workflowsContent";
import styles from "./DueOffsetField.module.css";

interface DueOffsetFieldProps {
  value: DueOffset;
  onChange: (value: DueOffset) => void;
  clockFormat: ClockFormat;
  /** Names the group of fields, e.g. "Due". */
  label: string;
}

const directionOptions = DueDirections.map((direction) => ({
  value: direction,
  label: Text.directions[direction],
}));

function whole(text: string, max: number): number {
  const value = Math.trunc(Number(text));
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), max) : 0;
}

export function DueOffsetField({
  value,
  onChange,
  clockFormat,
  label,
}: DueOffsetFieldProps) {
  const counting = value.direction !== "at";

  function changeDirection(direction: DueDirection) {
    if (direction === "at") onChange(atTheStart);
    else if (value.direction === "at")
      onChange({ ...atTheStart, direction, days: 1 });
    else onChange({ ...value, direction });
  }

  return (
    <fieldset className={styles.field} aria-label={label}>
      <div className={styles.row}>
        <Select
          label={label}
          options={directionOptions}
          value={value.direction}
          onChange={(event) =>
            changeDirection(event.target.value as DueDirection)
          }
          className={styles.when}
        />
        {counting ? (
          <TextField
            label={Text.days}
            type="number"
            inputMode="numeric"
            min={0}
            max={WorkflowLimits.dueDays}
            value={value.days}
            onChange={(event) =>
              onChange({
                ...value,
                days: whole(event.target.value, WorkflowLimits.dueDays),
              })
            }
            className={styles.number}
          />
        ) : null}
        {counting && value.time !== null ? (
          <TextField
            label={Text.time}
            type="time"
            value={value.time}
            onChange={(event) =>
              onChange({ ...value, time: event.target.value || "09:00" })
            }
            className={styles.time}
          />
        ) : null}
        {counting && value.time === null ? (
          <>
            <TextField
              label={Text.hours}
              type="number"
              inputMode="numeric"
              min={0}
              max={WorkflowLimits.dueHours}
              value={value.hours}
              onChange={(event) =>
                onChange({
                  ...value,
                  hours: whole(event.target.value, WorkflowLimits.dueHours),
                })
              }
              className={styles.number}
            />
            <TextField
              label={Text.minutes}
              type="number"
              inputMode="numeric"
              min={0}
              max={WorkflowLimits.dueMinutes}
              step={5}
              value={value.minutes}
              onChange={(event) =>
                onChange({
                  ...value,
                  minutes: whole(event.target.value, WorkflowLimits.dueMinutes),
                })
              }
              className={styles.number}
            />
          </>
        ) : null}
      </div>
      {counting ? (
        <Checkbox
          label={Text.atTime}
          checked={value.time !== null}
          onChange={(event) =>
            onChange({
              ...value,
              hours: 0,
              minutes: 0,
              time: event.target.checked ? "19:00" : null,
            })
          }
        />
      ) : null}
      {counting ? (
        <p className={styles.summary} aria-live="polite">
          {describeDue(value, clockFormat)}
        </p>
      ) : null}
    </fieldset>
  );
}
