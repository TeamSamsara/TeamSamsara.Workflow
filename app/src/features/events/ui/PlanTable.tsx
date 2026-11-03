// File : /TeamSamsara.Workflow/app/src/features/events/ui/PlanTable.tsx
// Version : 1.1.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The events being planned, one row each: date, start, end, a box
// per {gap}, the title it becomes and who can make it. A gap left empty is
// TBD and is marked in the title; a row missing its date is outlined in red.

import type { WhoCanMake } from "@/features/availability";
import type { FieldRecord } from "@/features/fields";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Table } from "@/shared/components/Table/Table";
import { gapLabel, type ValueText } from "../model/applyWorkflows";
import {
  emptyGaps,
  rowTitle,
  type PlanRow,
  type RowProblems,
} from "../model/planDraft";
import { EventLimits } from "../types/eventTypes";
import { PlanText as Text } from "./planContent";
import styles from "./PlanTable.module.css";

interface PlanTableProps {
  rows: readonly PlanRow[];
  gaps: readonly string[];
  titlePattern: string;
  /** By row key; null until the planner tries to create. */
  problems: Map<string, RowProblems> | null;
  /** Who can make each row; null when the events are for everyone (or nobody yet). */
  who: Map<string, WhoCanMake> | null;
  /** Said in the last column when who is null. */
  whoNote: string;
  onChange: (rows: PlanRow[]) => void;
  /** The workspace's fields, so a choice or a person is picked, not typed. */
  fields?: readonly FieldRecord[];
  /** Who a person field can be. */
  people?: readonly { id: string; name: string }[];
  /** How a value reads in the title it makes. */
  text?: ValueText;
}

/** The title with each TBD gap marked. */
function Title({ text }: { text: string }) {
  const parts = text.split(/(\{[A-Za-z][A-Za-z0-9_-]*\})/g);
  return (
    <>
      {parts.map((part, index) =>
        /^\{.+\}$/.test(part) ? (
          <mark key={index} className={styles.tbd}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function PlanTable({
  rows,
  gaps,
  fields = [],
  people = [],
  text,
  titlePattern,
  problems,
  who,
  whoNote,
  onChange,
}: PlanTableProps) {
  function change(key: string, changes: Partial<PlanRow>) {
    onChange(
      rows.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  }

  return (
    <Table
      caption={Text.rowsCaption}
      minWidth={760 + gaps.length * 140}
      className={styles.compact}
    >
      <thead>
        <tr>
          <th className={styles.number}>{Text.rowNumber}</th>
          <th>{Text.date}</th>
          <th>{Text.start}</th>
          <th>{Text.end}</th>
          {gaps.map((gap) => (
            <th key={gap} className={styles.gapHead}>
              {gapLabel(gap, fields)}
            </th>
          ))}
          <th>{Text.becomes}</th>
          <th>{Text.who}</th>
          <th>
            <span className={styles.hidden}>{Text.removeColumn}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const number = index + 1;
          const rowProblems = problems?.get(row.key);
          const check = who?.get(row.key);
          const missing = emptyGaps(row, gaps);
          return (
            <tr key={row.key}>
              <td className={styles.number}>{number}</td>
              <td>
                <input
                  type="date"
                  className={styles.input}
                  data-size="date"
                  aria-label={`${Text.date}, ${number}`}
                  aria-invalid={rowProblems?.date ? true : undefined}
                  value={row.date}
                  onChange={(event) =>
                    change(row.key, { date: event.target.value })
                  }
                />
              </td>
              <td>
                <input
                  type="time"
                  className={styles.input}
                  data-size="time"
                  aria-label={`${Text.start}, ${number}`}
                  value={row.time}
                  onChange={(event) =>
                    event.target.value &&
                    change(row.key, { time: event.target.value })
                  }
                />
              </td>
              <td>
                <input
                  type="time"
                  className={styles.input}
                  data-size="time"
                  aria-label={`${Text.end}, ${number}`}
                  value={row.endTime}
                  onChange={(event) =>
                    event.target.value &&
                    change(row.key, { endTime: event.target.value })
                  }
                />
              </td>
              {gaps.map((gap) => {
                const field = fields.find((entry) => entry.id === gap);
                const label = `${gapLabel(gap, fields)}, ${number}`;
                const value = row.values[gap] ?? "";
                const set = (next: string) =>
                  change(row.key, { values: { ...row.values, [gap]: next } });
                const options =
                  field?.type === "choice"
                    ? field.choices.map((choice) => ({
                        value: choice,
                        label: choice,
                      }))
                    : field?.type === "person"
                      ? people.map((person) => ({
                          value: person.id,
                          label: person.name,
                        }))
                      : null;
                return (
                  <td key={gap}>
                    {options ? (
                      <select
                        className={styles.input}
                        data-size="gap"
                        data-tbd={missing.includes(gap) ? true : undefined}
                        aria-label={label}
                        value={value}
                        onChange={(event) => set(event.target.value)}
                      >
                        <option value="">{Text.fillIn}</option>
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        {value &&
                        !options.some((option) => option.value === value) ? (
                          <option value={value}>{value}</option>
                        ) : null}
                      </select>
                    ) : (
                      <input
                        className={styles.input}
                        data-size="gap"
                        data-tbd={missing.includes(gap) ? true : undefined}
                        aria-label={label}
                        placeholder={Text.fillIn}
                        maxLength={EventLimits.detail}
                        type={
                          field?.type === "datetime"
                            ? "datetime-local"
                            : undefined
                        }
                        inputMode={
                          field?.type === "number" ? "decimal" : undefined
                        }
                        value={value}
                        onChange={(event) => set(event.target.value)}
                      />
                    )}
                  </td>
                );
              })}
              <td className={styles.title}>
                <Title text={rowTitle(titlePattern, row, text)} />
                {rowProblems?.title ? (
                  <span className={styles.error}>{rowProblems.title}</span>
                ) : null}
              </td>
              <td className={styles.who}>
                {check ? (
                  <span
                    className={styles.whoState}
                    data-all={check.free === check.total}
                  >
                    {check.free === check.total
                      ? Text.whoFree
                      : Text.whoSome(
                          check.free,
                          check.total,
                          check.away.slice(0, 2).join(", ") +
                            (check.away.length > 2 ? "…" : ""),
                        )}
                  </span>
                ) : (
                  <span className={styles.muted}>{whoNote}</span>
                )}
              </td>
              <td>
                <IconButton
                  icon="close"
                  variant="ghost"
                  size="small"
                  label={Text.remove(number)}
                  onClick={() =>
                    onChange(rows.filter((entry) => entry.key !== row.key))
                  }
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
