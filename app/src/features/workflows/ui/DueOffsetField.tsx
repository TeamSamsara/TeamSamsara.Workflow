// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/DueOffsetField.tsx
// Version : 1.1.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : Picks when a task is due, in everyday words: one list of the
// usual choices ("When the event starts", "1 hour before", "The day before"…),
// a time of day for the day ones, and Custom for anything else.

import { useState } from "react";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import type { ClockFormat } from "@/shared/time/dates";
import { describeDue, formatClockTime } from "../model/dueOffset";
import {
  DuePresets,
  DueUnits,
  fromAmount,
  halfHours,
  matchPreset,
  maxAmount,
  toAmount,
  type DueUnit,
} from "../model/duePresets";
import type { DueOffset } from "../types/workflowTypes";
import { DueFieldText as Text } from "./workflowsContent";
import styles from "./DueOffsetField.module.css";

interface DueOffsetFieldProps {
  value: DueOffset;
  onChange: (value: DueOffset) => void;
  clockFormat: ClockFormat;
  label: string;
  /** The explanation behind the "?" beside the label. */
  help?: string;
}

const custom = "custom";
const eventTime = "";

export function DueOffsetField({
  value,
  onChange,
  clockFormat,
  label,
  help,
}: DueOffsetFieldProps) {
  const preset = matchPreset(value);
  const [choseCustom, setChoseCustom] = useState(preset === null);
  const isCustom = choseCustom || preset === null;
  const amount = toAmount(value);
  const direction = value.direction === "after" ? "after" : "before";
  const inDays = isCustom
    ? value.direction !== "at" && amount.unit === "days"
    : Boolean(preset?.inDays);

  const presetOptions = [
    ...DuePresets.map((entry) => ({
      value: entry.id,
      label: describeDue(entry.offset, clockFormat),
    })),
    { value: custom, label: Text.custom },
  ];

  const times = halfHours();
  if (value.time && !times.includes(value.time)) times.push(value.time);
  const timeOptions = [
    { value: eventTime, label: Text.eventTime },
    ...times.sort().map((time) => ({
      value: time,
      label: formatClockTime(time, clockFormat),
    })),
  ];

  function choosePreset(id: string) {
    if (id === custom) {
      setChoseCustom(true);
      // Start custom from what's chosen, as an amount people can change.
      if (value.direction === "at")
        onChange(fromAmount({ amount: 2, unit: "hours" }, "before", null));
      return;
    }
    const next = DuePresets.find((entry) => entry.id === id);
    if (!next) return;
    setChoseCustom(false);
    // Keep the time of day when moving between day choices.
    onChange(next.inDays ? { ...next.offset, time: value.time } : next.offset);
  }

  function changeAmount(changes: {
    amount?: number;
    unit?: DueUnit;
    direction?: "before" | "after";
  }) {
    const unit = changes.unit ?? amount.unit;
    onChange(
      fromAmount(
        { amount: changes.amount ?? amount.amount, unit },
        changes.direction ?? direction,
        unit === "days" ? value.time : null,
      ),
    );
  }

  return (
    <div className={styles.field} role="group" aria-label={label}>
      <div className={styles.row}>
        <Select
          label={label}
          help={help}
          options={presetOptions}
          value={isCustom ? custom : (preset?.id ?? custom)}
          onChange={(event) => choosePreset(event.target.value)}
          className={styles.preset}
        />
        {inDays ? (
          <Select
            label={Text.at}
            options={timeOptions}
            value={value.time ?? eventTime}
            onChange={(event) =>
              onChange({ ...value, time: event.target.value || null })
            }
            className={styles.time}
          />
        ) : null}
      </div>

      {isCustom ? (
        <div className={styles.row}>
          <TextField
            label={Text.amount}
            type="number"
            inputMode="numeric"
            min={0}
            max={maxAmount[amount.unit]}
            value={amount.amount}
            onChange={(event) =>
              changeAmount({ amount: Number(event.target.value) })
            }
            className={styles.amount}
          />
          <Select
            label={Text.unit}
            options={DueUnits.map((unit) => ({
              value: unit,
              label: Text.units[unit],
            }))}
            value={amount.unit}
            onChange={(event) =>
              changeAmount({ unit: event.target.value as DueUnit })
            }
            className={styles.unit}
          />
          <Select
            label={Text.direction}
            options={[
              { value: "before", label: Text.directions.before },
              { value: "after", label: Text.directions.after },
            ]}
            value={direction}
            onChange={(event) =>
              changeAmount({
                direction: event.target.value as "before" | "after",
              })
            }
            className={styles.direction}
          />
        </div>
      ) : null}

      {isCustom ? (
        <p className={styles.summary} aria-live="polite">
          {Text.summary(describeDue(value, clockFormat))}
        </p>
      ) : null}
    </div>
  );
}
