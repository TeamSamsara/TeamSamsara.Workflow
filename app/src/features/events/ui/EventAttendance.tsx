// File : /TeamSamsara.Workflow/app/src/features/events/ui/EventAttendance.tsx
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Attendance on an event's page. "Are you going?" for each person
// asked: Going, Maybe or Can't go, saved as soon as it's picked, with an
// optional note. And who's coming: the counts, everyone's answer grouped into
// Required and Optional, what their availability says, and (for planners) a
// reminder for who hasn't replied.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { useWhoCanMake } from "@/features/availability";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { useToast } from "@/shared/components/Toast/useToast";
import {
  attendanceSummary,
  type Attendee,
  type ReplyState,
} from "../model/attendance";
import { remindReplies, saveReply } from "../service/replyService";
import {
  AttendanceLimits,
  ReplyAnswers,
  type ReplyAnswer,
} from "../types/attendance";
import type { EventRecord } from "../types/eventTypes";
import {
  AttendanceText,
  answerLabels,
  countLabels,
  ReplyText,
} from "./attendanceContent";
import styles from "./EventAttendance.module.css";

export interface AttendancePerson {
  id: string;
  name: string;
  photoUrl: string | null;
  workGroupIds: readonly string[];
}

interface ReplyCardProps {
  event: EventRecord;
  memberId: string;
  /** Who made the event, to say who asked. */
  plannerName: string | null;
}

/** "Are you going?" for the member, when the event asks them. */
export function ReplyCard({ event, memberId, plannerName }: ReplyCardProps) {
  const toast = useToast();
  const saved = event.replies[memberId] ?? null;
  const [note, setNote] = useState(saved?.note ?? "");
  const [picked, setPicked] = useState<ReplyAnswer | null>(
    saved?.answer ?? null,
  );
  const required = event.requiredIds.includes(memberId);
  const answer = picked ?? saved?.answer ?? null;

  const save = useMutation({
    mutationFn: (choice: { answer: ReplyAnswer; note: string }) =>
      saveReply(event.id, memberId, choice.answer, choice.note),
    onSuccess: (_result, choice) =>
      toast.show({
        tone: "success",
        title: ReplyText.saved(answerLabels[choice.answer]),
      }),
  });

  return (
    <section className={styles.card} aria-labelledby="event-reply">
      <div className={styles.head}>
        <h2 id="event-reply" className={styles.title}>
          {ReplyText.title}
        </h2>
        <span className={styles.badge} data-required={required || undefined}>
          {required ? ReplyText.required : ReplyText.optional}
        </span>
      </div>
      <p className={styles.muted}>
        {plannerName ? ReplyText.askedBy(plannerName) : ReplyText.asked}
      </p>
      {save.error ? (
        <Banner tone="error">
          {ReplyText.failed}: {dataErrorMessage(save.error)}
        </Banner>
      ) : null}
      <div
        role="group"
        aria-label={ReplyText.answersLabel}
        className={styles.answers}
      >
        {ReplyAnswers.map((choice) => (
          <button
            key={choice}
            type="button"
            className={styles.answer}
            data-answer={choice}
            aria-pressed={answer === choice}
            disabled={save.isPending}
            onClick={() => {
              setPicked(choice);
              save.mutate({ answer: choice, note });
            }}
          >
            {answerLabels[choice]}
          </button>
        ))}
      </div>
      {answer && (answer !== "going" || note) ? (
        <form
          className={styles.noteRow}
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            save.mutate({ answer, note });
          }}
        >
          <TextField
            className={styles.note}
            label={`${ReplyText.note} ${ReplyText.noteOptional}`}
            placeholder={ReplyText.notePlaceholders[answer]}
            value={note}
            maxLength={AttendanceLimits.note}
            onChange={(changeEvent) => setNote(changeEvent.target.value)}
          />
          {note.trim() !== (saved?.note ?? "") ? (
            <Button type="submit" isLoading={save.isPending}>
              {ReplyText.saveNote}
            </Button>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}

function AttendeeRow({
  entry,
  you,
}: {
  entry: Attendee<AttendancePerson>;
  you: boolean;
}) {
  const state: ReplyState = entry.reply?.answer ?? "waiting";
  return (
    <li className={styles.person}>
      <Avatar
        name={entry.person.name}
        src={entry.person.photoUrl}
        size="small"
      />
      <span className={styles.who}>
        <b>{you ? AttendanceText.you(entry.person.name) : entry.person.name}</b>
        {entry.reply?.note ? (
          <span className={styles.quote}>“{entry.reply.note}”</span>
        ) : null}
      </span>
      <span className={styles.pill} data-answer={state}>
        {answerLabels[state]}
      </span>
    </li>
  );
}

interface AttendanceCardProps {
  event: EventRecord;
  /** Everyone who could be in it; the event's own people are picked out. */
  people: readonly AttendancePerson[];
  meId: string | null;
  canRemind: boolean;
  timeZone: string;
  now: Date;
}

/** Who's coming: counts, everyone's answer, and a reminder for planners. */
export function AttendanceCard({
  event,
  people,
  meId,
  canRemind,
  timeZone,
  now,
}: AttendanceCardProps) {
  const toast = useToast();
  const summary = attendanceSummary(event, people);
  const everyone = [...summary.required, ...summary.optional].map(
    (entry) => entry.person,
  );
  const upcoming = event.endsAt.getTime() > now.getTime();
  const check = useWhoCanMake(
    upcoming ? everyone : [],
    upcoming
      ? [{ key: event.id, start: event.startsAt, end: event.endsAt }]
      : [],
    timeZone,
    event.requiredIds,
  ).get(event.id);
  const waiting = summary.waitingIds.length;

  const remind = useMutation({
    mutationFn: () => remindReplies(event.id),
    onSuccess: (count) =>
      toast.show({ tone: "success", title: AttendanceText.reminded(count) }),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: AttendanceText.remindFailed,
        detail: error.message,
      }),
  });

  const counts: ReplyState[] = ["going", "maybe", "cant", "waiting"];
  const groups = [
    {
      key: "required",
      name: AttendanceText.requiredGroup(summary.required.length),
      entries: summary.required,
    },
    {
      key: "optional",
      name: AttendanceText.optionalGroup(summary.optional.length),
      entries: summary.optional,
    },
  ].filter((group) => group.entries.length > 0);

  return (
    <section className={styles.card} aria-labelledby="event-attendance">
      <div className={styles.head}>
        <h2 id="event-attendance" className={styles.title}>
          {AttendanceText.title}
        </h2>
      </div>
      <div className={styles.counts}>
        {counts.map((state) => (
          <span key={state} className={styles.count} data-answer={state}>
            <b>{summary.counts[state]}</b>
            {countLabels[state]}
          </span>
        ))}
      </div>
      {canRemind && upcoming && waiting > 0 ? (
        <Button
          variant="ghost"
          size="small"
          iconStart="notifications"
          isLoading={remind.isPending}
          onClick={() => remind.mutate()}
          className={styles.remind}
        >
          {AttendanceText.remind(waiting)}
        </Button>
      ) : null}
      {groups.length === 0 ? (
        <p className={styles.muted}>{AttendanceText.nobody}</p>
      ) : (
        groups.map((group) => (
          <div key={group.key} className={styles.group}>
            <h3 className={styles.groupName}>{group.name}</h3>
            <ul className={styles.people}>
              {group.entries.map((entry) => (
                <AttendeeRow
                  key={entry.person.id}
                  entry={entry}
                  you={entry.person.id === meId}
                />
              ))}
            </ul>
          </div>
        ))
      )}
      {check && check.total > 0 ? (
        <p className={styles.muted}>
          {AttendanceText.free(check.free, check.total)}
        </p>
      ) : null}
    </section>
  );
}
