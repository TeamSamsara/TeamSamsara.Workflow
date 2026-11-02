// File : /TeamSamsara.Workflow/app/src/features/events/ui/EventForm.tsx
// Version : 1.6.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : An event's details as a form: title, type, date, start and end,
// who's in it (and who of them can make it), link, a box per {gap} its
// workflows ask for, and notes.

import type { ColouredItem } from "@/core/data";
import { PlannedZoneNote, useWorkspaceRecord } from "@/core/workspace";
import { AvailabilityCheck } from "@/features/availability";
import { TourTarget } from "@/features/onboarding";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey, formatTime } from "@/shared/time/dates";
import { toWallTime } from "@/shared/time/zonedTime";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { gapLabel } from "../model/applyWorkflows";
import {
  fieldsFromDraft,
  titleGaps,
  withStartTime,
  type EventDraft,
  type EventDraftProblems,
} from "../model/eventDraft";
import type { AudienceOptions } from "../hooks/useAudienceOptions";
import { EventLimits } from "../types/eventTypes";
import { AudiencePicker } from "./AudiencePicker";
import { EventFormText as Text } from "./eventsContent";
import styles from "./EventForm.module.css";

interface EventFormProps {
  draft: EventDraft;
  onChange: (changes: Partial<EventDraft>) => void;
  eventTypes: readonly ColouredItem[];
  /** The gaps to ask for, e.g. ["opponent"]. */
  gaps: readonly string[];
  problems: EventDraftProblems | null;
  /** The groups and people that can be put in it. */
  people: AudienceOptions;
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
  people,
  hideDate = false,
  autoFocus = true,
}: EventFormProps) {
  const workspace = useWorkspaceRecord();
  const now = useNow();
  const tz = workspace.timeZone;
  const fields = hideDate ? null : fieldsFromDraft(draft, tz);
  // The workflows' gaps and any written in the title ("vs. {opponent}").
  const asked = [...new Set([...titleGaps(draft.title), ...gaps])];
  // Who's in it, as people: everyone in its groups and the people added.
  const checked = draft.audience.everyone
    ? []
    : [
        ...new Set([
          ...draft.audience.groupIds.flatMap(
            (id) =>
              people.groups.find((group) => group.id === id)?.memberIds ?? [],
          ),
          ...draft.audience.memberIds,
        ]),
      ]
        .map((id) => people.members.find((member) => member.id === id))
        .filter((member): member is { id: string; name: string } =>
          Boolean(member),
        );
  const timeOf = (date: Date) => formatTime(date, tz, workspace.timeFormat);
  const weekday = (date: Date) =>
    new Date(`${dayKey(date, tz)}T12:00:00Z`).toLocaleString("en", {
      weekday: "short",
      timeZone: "UTC",
    });

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
          onChange={(event) =>
            event.target.value &&
            onChange(withStartTime(draft, event.target.value))
          }
          className={styles.time}
        />
        <TextField
          label={Text.endTime}
          help={Text.endTimeHelp}
          type="time"
          value={draft.endTime}
          onChange={(event) =>
            event.target.value && onChange({ endTime: event.target.value })
          }
          className={styles.time}
        />
      </div>
      <PlannedZoneNote />
      <TourTarget id="eventPeople">
        <AudiencePicker
          value={draft.audience}
          onChange={(audience) => onChange({ audience })}
          groups={people.groups}
          members={people.members}
        />
      </TourTarget>
      {fields && checked.length > 0 ? (
        <AvailabilityCheck
          people={checked}
          start={fields.startsAt}
          end={fields.endsAt}
          timeZone={tz}
          now={now}
          spanLabel={(start, end) => `${timeOf(start)} – ${timeOf(end)}`}
          slotLabel={(start, end) =>
            `${weekday(start)} ${timeOf(start)} – ${timeOf(end)}`
          }
          onPick={(start) => {
            const wall = toWallTime(start, tz);
            const time = `${String(wall.hour).padStart(2, "0")}:${String(wall.minute).padStart(2, "0")}`;
            onChange({
              ...withStartTime(draft, time),
              date: dayKey(start, tz),
            });
          }}
        />
      ) : null}
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
      {asked.length > 0 ? (
        <fieldset className={styles.details}>
          <legend className={styles.legend}>{Text.details}</legend>
          <p className={styles.muted}>{Text.detailsHelp}</p>
          <div className={styles.gapGrid}>
            {asked.map((gap) => (
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
