// File : /TeamSamsara.Workflow/app/src/features/events/ui/EventForm.tsx
// Version : 1.1.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : An event's details as a form: title, type, date and time, link,
// a box per {gap} its workflows ask for, and notes.

import type { ColouredItem } from "@/core/data";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { gapLabel } from "../model/applyWorkflows";
import type { EventDraft, EventDraftProblems } from "../model/eventDraft";
import { EventLimits } from "../types/eventTypes";
import { EventFormText as Text } from "./eventsContent";
import styles from "./EventForm.module.css";

interface EventFormProps {
  draft: EventDraft;
  onChange: (changes: Partial<EventDraft>) => void;
  eventTypes: readonly ColouredItem[];
  /** The gaps to ask for, e.g. ["opponent"]. */
  gaps: readonly string[];
  problems: EventDraftProblems | null;
  /** Leaves the date out, for changing a repeat (its days are set apart). */
  hideDate?: boolean;
  /** Focuses the title when the form opens. */
  autoFocus?: boolean;
}

export function EventForm({
  draft,
  onChange,
  eventTypes,
  gaps,
  problems,
  hideDate = false,
  autoFocus = true,
}: EventFormProps) {
  return (
    <div className={styles.form}>
      <TextField
        label={Text.title}
        placeholder={Text.titlePlaceholder}
        value={draft.title}
        maxLength={EventLimits.title}
        onChange={(event) => onChange({ title: event.target.value })}
        error={problems?.title}
        autoFocus={autoFocus}
      />
      <div className={styles.row}>
        <Select
          label={Text.type}
          help={Text.typeHelp}
          options={[
            { value: "", label: Text.noType },
            ...eventTypes.map((type) => ({ value: type.id, label: type.name })),
          ]}
          value={draft.eventTypeId ?? ""}
          onChange={(event) =>
            onChange({ eventTypeId: event.target.value || null })
          }
          className={styles.type}
        />
        {hideDate ? null : (
          <TextField
            label={Text.date}
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ date: event.target.value })}
            error={problems?.date}
            className={styles.date}
          />
        )}
        <TextField
          label={Text.time}
          type="time"
          value={draft.time}
          onChange={(event) => onChange({ time: event.target.value })}
          className={styles.time}
        />
      </div>
      <TextField
        label={Text.link}
        help={Text.linkHelp}
        type="url"
        inputMode="url"
        placeholder={Text.linkPlaceholder}
        value={draft.link}
        maxLength={EventLimits.link}
        onChange={(event) => onChange({ link: event.target.value })}
        error={problems?.link}
      />
      {gaps.length > 0 ? (
        <fieldset className={styles.details}>
          <legend className={styles.legend}>{Text.details}</legend>
          <p className={styles.muted}>{Text.detailsHelp}</p>
          <div className={styles.gapGrid}>
            {gaps.map((gap) => (
              <TextField
                key={gap}
                label={gapLabel(gap)}
                placeholder={`{${gap}}`}
                value={draft.details[gap] ?? ""}
                maxLength={EventLimits.detail}
                onChange={(event) =>
                  onChange({
                    details: { ...draft.details, [gap]: event.target.value },
                  })
                }
              />
            ))}
          </div>
        </fieldset>
      ) : null}
      <TextArea
        label={Text.notes}
        placeholder={Text.notesPlaceholder}
        value={draft.notes}
        rows={2}
        maxLength={EventLimits.notes}
        onChange={(event) => onChange({ notes: event.target.value })}
      />
    </div>
  );
}
