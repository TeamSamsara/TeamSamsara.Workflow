// File : /TeamSamsara.Workflow/app/src/features/availability/ui/ExceptionsCard.tsx
// Version : 1.0.0
// Latest commit: feature/people-time
// Author : Gerrah
// Purpose : The dates that aren't like a member's usual week, and a dialog to
// add one: unavailable or available, all day or between two times.

import { useState } from "react";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import {
  AvailabilityLimits,
  type AvailabilityException,
} from "../types/availabilityTypes";
import { ExceptionsText as Text } from "./availabilityContent";
import styles from "./AvailabilityCards.module.css";

interface ExceptionsCardProps {
  exceptions: readonly AvailabilityException[];
  onChange: (exceptions: AvailabilityException[]) => void;
  dayLabel: (dateKey: string) => string;
  timeLabel: (clock: string) => string;
  today: string;
}

export function ExceptionsCard({
  exceptions,
  onChange,
  dayLabel,
  timeLabel,
  today,
}: ExceptionsCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const shown = [...exceptions]
    .map((exception, index) => ({ exception, index }))
    .filter(({ exception }) => exception.date >= today)
    .sort((a, b) => a.exception.date.localeCompare(b.exception.date));

  return (
    <section className={styles.card} aria-labelledby="exceptions-title">
      <h2 id="exceptions-title" className={styles.title}>
        {Text.title}
      </h2>
      <p className={styles.muted}>{Text.description}</p>
      {shown.length === 0 ? (
        <p className={styles.empty}>{Text.none}</p>
      ) : (
        <ul className={styles.list}>
          {shown.map(({ exception, index }) => (
            <li key={`${exception.date}-${index}`} className={styles.row}>
              <span className={styles.rowText}>
                <b>{dayLabel(exception.date)}</b>
                <span className={styles.muted}>
                  {exception.available ? Text.available : Text.unavailable} ·{" "}
                  {exception.from && exception.to
                    ? `${timeLabel(exception.from)} – ${timeLabel(exception.to)}`
                    : Text.allDay}
                </span>
              </span>
              <IconButton
                icon="close"
                variant="ghost"
                size="small"
                label={Text.remove(dayLabel(exception.date))}
                onClick={() =>
                  onChange(
                    exceptions.filter(
                      (_entry, entryIndex) => entryIndex !== index,
                    ),
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
      <Button
        size="small"
        iconStart="add"
        onClick={() => setIsAdding(true)}
        disabled={exceptions.length >= AvailabilityLimits.exceptions}
        className={styles.addButton}
      >
        {Text.add}
      </Button>
      {isAdding ? (
        <ExceptionDialog
          today={today}
          onAdd={(exception) => {
            onChange([...exceptions, exception]);
            setIsAdding(false);
          }}
          onClose={() => setIsAdding(false)}
        />
      ) : null}
    </section>
  );
}

function ExceptionDialog({
  today,
  onAdd,
  onClose,
}: {
  today: string;
  onAdd: (exception: AvailabilityException) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(today);
  const [available, setAvailable] = useState(false);
  const [allDay, setAllDay] = useState(true);
  const [from, setFrom] = useState("18:00");
  const [to, setTo] = useState("22:00");
  const [tried, setTried] = useState(false);
  const dateProblem = date ? null : Text.dialog.dateRequired;
  const timeProblem = !allDay && to <= from ? Text.dialog.timesWrong : null;

  return (
    <Modal
      title={Text.dialog.title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {Text.dialog.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (dateProblem || timeProblem) return;
              onAdd({
                date,
                available,
                from: allDay ? null : from,
                to: allDay ? null : to,
              });
            }}
          >
            {Text.dialog.add}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <TextField
          label={Text.dialog.date}
          type="date"
          min={today}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          error={tried ? dateProblem : null}
        />
        <SegmentedControl
          label={Text.dialog.kind}
          options={[
            { value: "unavailable", label: Text.unavailable },
            { value: "available", label: Text.available },
          ]}
          value={available ? "available" : "unavailable"}
          onChange={(value) => setAvailable(value === "available")}
        />
        <Checkbox
          label={Text.dialog.allDay}
          checked={allDay}
          onChange={(event) => setAllDay(event.target.checked)}
        />
        {allDay ? null : (
          <div className={styles.times}>
            <TextField
              label={Text.dialog.from}
              type="time"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
            <TextField
              label={Text.dialog.to}
              type="time"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              error={tried ? timeProblem : null}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
