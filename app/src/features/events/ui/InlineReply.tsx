// File : /TeamSamsara.Workflow/app/src/features/events/ui/InlineReply.tsx
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Replying right from a notification: Going, Maybe or Can't go
// (which asks for an optional reason first), then "You replied" with a way to
// change it. Shows nothing once the event is gone or no longer asks.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "@/core/session";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { useEvent } from "../hooks/useEvents";
import { isAsked } from "../model/attendance";
import { saveReply } from "../service/replyService";
import {
  AttendanceLimits,
  ReplyAnswers,
  type ReplyAnswer,
} from "../types/attendance";
import { answerLabels, ReplyText } from "./attendanceContent";
import styles from "./InlineReply.module.css";

export function InlineReply({ eventId }: { eventId: string }) {
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const event = useEvent(eventId);
  const [step, setStep] = useState<"ask" | "reason">("ask");
  const [changing, setChanging] = useState(false);
  const [reason, setReason] = useState("");

  const save = useMutation({
    mutationFn: (choice: { answer: ReplyAnswer; note: string }) => {
      if (!member) throw new Error("Not signed in");
      return saveReply(eventId, member.id, choice.answer, choice.note);
    },
    onSuccess: () => {
      setStep("ask");
      setChanging(false);
    },
  });

  if (!event || !member || !isAsked(event, member)) return null;
  const saved = event.replies[member.id] ?? null;

  if (saved && !changing)
    return (
      <div className={styles.row}>
        <span className={styles.pill} data-answer={saved.answer}>
          {ReplyText.youReplied(answerLabels[saved.answer])}
        </span>
        <button
          type="button"
          className={styles.link}
          onClick={() => setChanging(true)}
        >
          {ReplyText.change}
        </button>
      </div>
    );

  if (step === "reason")
    return (
      <form
        className={styles.reason}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          save.mutate({ answer: "cant", note: reason });
        }}
      >
        <TextField
          label={`${ReplyText.reasonLabel} ${ReplyText.noteOptional}`}
          placeholder={ReplyText.reasonPlaceholder}
          value={reason}
          maxLength={AttendanceLimits.note}
          onChange={(changeEvent) => setReason(changeEvent.target.value)}
          autoFocus
        />
        <div className={styles.row}>
          <Button
            type="submit"
            size="small"
            variant="primary"
            isLoading={save.isPending}
          >
            {ReplyText.send}
          </Button>
          <Button size="small" variant="ghost" onClick={() => setStep("ask")}>
            {ReplyText.back}
          </Button>
        </div>
      </form>
    );

  return (
    <div
      role="group"
      aria-label={ReplyText.answersLabel}
      className={styles.row}
    >
      {ReplyAnswers.map((answer) => (
        <Button
          key={answer}
          size="small"
          isLoading={save.isPending && save.variables?.answer === answer}
          onClick={() =>
            answer === "cant"
              ? setStep("reason")
              : save.mutate({ answer, note: saved?.note ?? "" })
          }
        >
          {answerLabels[answer]}
        </Button>
      ))}
    </div>
  );
}
