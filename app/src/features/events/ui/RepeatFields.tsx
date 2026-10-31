// File : /TeamSamsara.Workflow/app/src/features/events/ui/RepeatFields.tsx
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : How an event repeats: the weekdays, when it ends, dates to skip,
// and which events that makes in the weeks ahead. Hidden behind "Repeat…"
// until asked for, since most events happen once.

import { useId, useState } from "react";
import { Button } from "@/shared/components/Button/Button";
import { Chip } from "@/shared/components/Chip/Chip";
import { FieldError } from "@/shared/components/Fields/FieldError/FieldError";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { HelpTip } from "@/shared/components/HelpTip/HelpTip";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import type { RepeatDraft, RepeatDraftProblems } from "../model/repeatDraft";
import { RepeatSummaryText } from "../model/repeatContent";
import { weekOrder } from "../model/repeatSummary";
import { RepeatEnds, RepeatLimits } from "../types/repeatTypes";
import { RepeatFieldsText as Text } from "./repeatFieldsContent";
import styles from "./RepeatFields.module.css";

const shownDates = 6;

interface RepeatFieldsProps {
  draft: RepeatDraft;
  onChange: (changes: Partial<RepeatDraft>) => void;
  /** Takes the repeat away; left out where it can't be (editing a repeat). */
  onRemove?: () => void;
  weekStartsOn: "monday" | "sunday";
  /** The dates it would make events on in the weeks ahead; null without a first date. */
  upcoming: readonly string[] | null;
  dayLabel: (key: string) => string;
  problems: RepeatDraftProblems | null;
}

export function RepeatFields({
  draft,
  onChange,
  onRemove,
  weekStartsOn,
  upcoming,
  dayLabel,
  problems,
}: RepeatFieldsProps) {
  const [skipDate, setSkipDate] = useState("");
  const titleId = useId();

  function toggleDay(day: number) {
    onChange({
      weekdays: draft.weekdays.includes(day)
        ? draft.weekdays.filter((entry) => entry !== day)
        : [...draft.weekdays, day],
    });
  }

  function addSkip() {
    if (!skipDate || draft.skipDates.includes(skipDate)) return;
    onChange({ skipDates: [...draft.skipDates, skipDate].sort() });
    setSkipDate("");
  }

  return (
    <div className={styles.panel} role="group" aria-labelledby={titleId}>
      <div className={styles.head}>
        <span id={titleId} className={styles.headTitle}>
          {Text.title}
        </span>
        {onRemove ? (
          <Button
            variant="ghost"
            size="small"
            iconStart="close"
            onClick={onRemove}
          >
            {Text.remove}
          </Button>
        ) : null}
      </div>

      <div className={styles.group} role="group" aria-label={Text.on}>
        <span className={styles.label}>{Text.on}</span>
        <div className={styles.days}>
          {weekOrder(weekStartsOn).map((day) => (
            <button
              key={day}
              type="button"
              className={styles.day}
              aria-pressed={draft.weekdays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {RepeatSummaryText.weekdays[day]}
            </button>
          ))}
        </div>
        {problems?.weekdays ? (
          <FieldError id="repeat-weekdays-error" message={problems.weekdays} />
        ) : null}
      </div>

      <div className={styles.group}>
        <span className={styles.label} aria-hidden>
          {Text.ends}
        </span>
        <div className={styles.endRow}>
          <SegmentedControl
            label={Text.ends}
            options={RepeatEnds.map((value) => ({
              value,
              label: Text.endKinds[value],
            }))}
            value={draft.endKind}
            onChange={(endKind) => onChange({ endKind })}
          />
          {draft.endKind === "onDate" ? (
            <TextField
              label={Text.endDate}
              type="date"
              value={draft.endDate}
              onChange={(event) => onChange({ endDate: event.target.value })}
              error={problems?.endDate}
              className={styles.endField}
            />
          ) : draft.endKind === "afterCount" ? (
            <TextField
              label={Text.endCount}
              type="number"
              inputMode="numeric"
              min={1}
              max={RepeatLimits.endCount}
              value={draft.endCount}
              onChange={(event) => onChange({ endCount: event.target.value })}
              error={problems?.endCount}
              className={styles.countField}
            />
          ) : null}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>
          {Text.skip}
          <HelpTip topic={Text.skip}>{Text.skipHelp}</HelpTip>
        </span>
        <div className={styles.skipRow}>
          <TextField
            label={Text.skipDate}
            hideLabel
            type="date"
            value={skipDate}
            onChange={(event) => setSkipDate(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSkip();
              }
            }}
            className={styles.endField}
          />
          <Button
            size="small"
            onClick={addSkip}
            disabled={
              !skipDate || draft.skipDates.length >= RepeatLimits.skipDates
            }
          >
            {Text.addSkip}
          </Button>
        </div>
        {draft.skipDates.length > 0 ? (
          <div className={styles.chips}>
            {draft.skipDates.map((date) => (
              <Chip
                key={date}
                label={dayLabel(date)}
                variant="outline"
                onRemove={() =>
                  onChange({
                    skipDates: draft.skipDates.filter(
                      (entry) => entry !== date,
                    ),
                  })
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.preview} aria-live="polite">
        {upcoming === null ? (
          <p className={styles.muted}>{Text.pickDate}</p>
        ) : (
          <>
            <p className={styles.previewTitle}>
              {Text.preview(upcoming.length, RepeatLimits.weeksAhead)}
            </p>
            {upcoming.length > 0 ? (
              <p className={styles.dates}>
                {upcoming.slice(0, shownDates).map(dayLabel).join(" · ")}
                {upcoming.length > shownDates
                  ? ` ${Text.more(upcoming.length - shownDates)}`
                  : ""}
              </p>
            ) : null}
            <p className={styles.muted}>
              {Text.ahead(RepeatLimits.weeksAhead)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
