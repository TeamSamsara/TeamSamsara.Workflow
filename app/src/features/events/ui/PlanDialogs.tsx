// File : /TeamSamsara.Workflow/app/src/features/events/ui/PlanDialogs.tsx
// Version : 1.0.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : The two quick ways to fill the planning table. A pattern: these
// weekdays, every week or every few, between two dates, at a time. A paste:
// rows copied from a spreadsheet, each column matched to the date, a time or
// one of the {gaps}, with what can't be read said plainly before adding.

import { useState } from "react";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import {
  gapColumn,
  guessColumns,
  readPasted,
  splitTable,
  type ColumnKind,
  type ReadOptions,
} from "../model/pasteRows";
import {
  patternDates,
  patternRows,
  rowKey,
  type PlanPattern,
  type PlanRow,
} from "../model/planDraft";
import { RepeatSummaryText } from "../model/repeatContent";
import { weekOrder } from "../model/repeatSummary";
import { addDays, weekdayOf } from "../model/repeatRule";
import { PlanText } from "./planContent";
import repeatStyles from "./RepeatFields.module.css";
import styles from "./PlanDialogs.module.css";

interface PatternDialogProps {
  /** Where the pattern starts: after the last row, or today. */
  from: string;
  time: string;
  endTime: string;
  weekStartsOn: "monday" | "sunday";
  onAdd: (rows: PlanRow[]) => void;
  onClose: () => void;
}

export function PatternDialog({
  from,
  time,
  endTime,
  weekStartsOn,
  onAdd,
  onClose,
}: PatternDialogProps) {
  const Text = PlanText.pattern;
  const [pattern, setPattern] = useState<PlanPattern>(() => ({
    weekdays: [weekdayOf(from)],
    every: 1,
    from,
    until: addDays(from, 9 * 7),
    time,
    endTime,
  }));
  const dates = patternDates(pattern);
  const change = (changes: Partial<PlanPattern>) =>
    setPattern((current) => ({ ...current, ...changes }));

  return (
    <Modal
      title={Text.title}
      description={Text.description}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {Text.cancel}
          </Button>
          <Button
            variant="primary"
            iconStart="add"
            disabled={dates.length === 0}
            onClick={() => onAdd(patternRows(pattern))}
          >
            {Text.add(dates.length)}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.group} role="group" aria-label={Text.days}>
          <span className={styles.label}>{Text.days}</span>
          <div className={repeatStyles.days}>
            {weekOrder(weekStartsOn).map((day) => (
              <button
                key={day}
                type="button"
                className={repeatStyles.day}
                aria-pressed={pattern.weekdays.includes(day)}
                onClick={() =>
                  change({
                    weekdays: pattern.weekdays.includes(day)
                      ? pattern.weekdays.filter((entry) => entry !== day)
                      : [...pattern.weekdays, day],
                  })
                }
              >
                {RepeatSummaryText.weekdays[day]}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.row}>
          <Select
            label={Text.every}
            options={[1, 2, 3, 4].map((count) => ({
              value: String(count),
              label: Text.weeks(count),
            }))}
            value={String(pattern.every)}
            onChange={(event) => change({ every: Number(event.target.value) })}
            className={styles.every}
          />
          <TextField
            label={Text.from}
            type="date"
            value={pattern.from}
            onChange={(event) => change({ from: event.target.value })}
          />
          <TextField
            label={Text.until}
            type="date"
            value={pattern.until}
            onChange={(event) => change({ until: event.target.value })}
          />
        </div>
        <div className={styles.row}>
          <TextField
            label={Text.start}
            type="time"
            value={pattern.time}
            onChange={(event) =>
              event.target.value && change({ time: event.target.value })
            }
          />
          <TextField
            label={Text.end}
            type="time"
            value={pattern.endTime}
            onChange={(event) =>
              event.target.value && change({ endTime: event.target.value })
            }
          />
        </div>
        <p className={styles.note} aria-live="polite">
          {Text.preview(dates.length)}
        </p>
      </div>
    </Modal>
  );
}

interface PasteDialogProps {
  gaps: readonly string[];
  usual: { time: string; endTime: string };
  options: ReadOptions;
  timeZone: string;
  onAdd: (rows: PlanRow[]) => void;
  onClose: () => void;
}

export function PasteDialog({
  gaps,
  usual,
  options,
  timeZone,
  onAdd,
  onClose,
}: PasteDialogProps) {
  const Text = PlanText.pasteDialog;
  const [text, setText] = useState("");
  // The planner's own choices, by column; the rest are guessed.
  const [picked, setPicked] = useState<Record<number, ColumnKind>>({});
  const [header, setHeader] = useState<boolean | null>(null);
  const table = splitTable(text);
  const guess = guessColumns(table, gaps, options);
  const hasHeader = header ?? guess.hasHeader;
  const kinds = guess.kinds.map((kind, column) => picked[column] ?? kind);
  const read = readPasted(table, { kinds, hasHeader }, usual, options);
  const hasDate = kinds.includes("date");
  const choices = [
    { value: "ignore", label: Text.ignore },
    { value: "date", label: Text.date },
    { value: "start", label: Text.start },
    { value: "end", label: Text.end },
    ...gaps.map((gap) => ({
      value: gapColumn(gap),
      label: Text.gap(gap),
    })),
  ];
  const sample = (column: number) =>
    table.slice(hasHeader ? 1 : 0).find((row) => row[column]?.trim())?.[
      column
    ] ?? "";

  function choose(column: number, kind: ColumnKind) {
    // A kind is used by one column only: the one it was on is left out.
    const next = { ...picked, [column]: kind };
    if (kind !== "ignore")
      kinds.forEach((current, other) => {
        if (other !== column && current === kind) next[other] = "ignore";
      });
    setPicked(next);
  }

  return (
    <Modal
      title={Text.title}
      description={Text.description}
      size="wide"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {Text.cancel}
          </Button>
          <Button
            variant="primary"
            iconStart="add"
            disabled={read.rows.length === 0}
            onClick={() =>
              onAdd(read.rows.map((row) => ({ ...row, key: rowKey() })))
            }
          >
            {Text.add(read.rows.length)}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <TextArea
          label={Text.label}
          placeholder={Text.placeholder}
          rows={6}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPicked({});
            setHeader(null);
          }}
          className={styles.paste}
          autoFocus
        />
        {table.length > 0 ? (
          <>
            <div className={styles.group}>
              <span className={styles.label}>{Text.columns}</span>
              <div className={styles.columns}>
                {kinds.map((kind, column) => (
                  <div key={column} className={styles.column}>
                    <span className={styles.sample} title={sample(column)}>
                      {sample(column) || Text.column(column)}
                    </span>
                    <Select
                      label={Text.column(column)}
                      hideLabel
                      options={choices}
                      value={kind}
                      onChange={(event) =>
                        choose(column, event.target.value as ColumnKind)
                      }
                    />
                  </div>
                ))}
              </div>
              <Checkbox
                label={Text.firstRowHeader}
                checked={hasHeader}
                onChange={(event) => setHeader(event.target.checked)}
              />
            </div>
            {!hasDate ? (
              <p className={styles.warn}>{Text.noDate}</p>
            ) : (
              <div className={styles.good}>
                <b>{Text.read(read.rows.length)}</b>
                <span>{Text.readHelp(timeZone)}</span>
              </div>
            )}
            {read.skipped.length > 0 && hasDate ? (
              <p className={styles.warn}>{Text.skipped(read.skipped)}</p>
            ) : null}
            {read.unknown > 0 ? (
              <p className={styles.warn}>{Text.unknown(read.unknown)}</p>
            ) : null}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
