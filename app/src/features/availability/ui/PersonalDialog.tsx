// File : /TeamSamsara.Workflow/app/src/features/availability/ui/PersonalDialog.tsx
// Version : 1.1.0
// Latest commit: fix/private-appointments
// Author : Gerrah
// Purpose : Adding or changing a personal appointment (a class, a shift, a
// dentist visit): what, when, all day or between two times, notes, and
// whether to share it with the member's group leads (only they see what it is
// then; everyone else always sees Busy). A saved one can be deleted from here.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { fromDateAndTime, toDateAndTime } from "@/features/tasks";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { Icon } from "@/shared/icons/Icon";
import { addDayKeys } from "@/shared/time/weekGrid";
import { deletePersonal, savePersonal } from "../service/availabilityService";
import {
  AvailabilityLimits,
  type PersonalEntry,
} from "../types/availabilityTypes";
import { PersonalText as Text } from "./availabilityContent";
import styles from "./AvailabilityCards.module.css";

interface PersonalDialogProps {
  memberId: string;
  /** The appointment to change; leave out to add one. */
  entry?: PersonalEntry;
  /** The date it starts on when adding ("2026-11-02"). */
  date?: string;
  timeZone: string;
  /** The leads of the member's work groups, who it can be shared with. */
  leads: readonly { id: string; name: string }[];
  onClose: () => void;
}

export function PersonalDialog({
  memberId,
  entry,
  date,
  timeZone,
  leads,
  onClose,
}: PersonalDialogProps) {
  const toast = useToast();
  const start = entry ? toDateAndTime(entry.startsAt, timeZone) : null;
  const end = entry ? toDateAndTime(entry.endsAt, timeZone) : null;
  const wasAllDay = Boolean(
    start && end && start.time === "00:00" && end.time === "00:00",
  );
  const [title, setTitle] = useState(entry?.title ?? "");
  const [day, setDay] = useState(start?.date ?? date ?? "");
  const [from, setFrom] = useState(
    wasAllDay ? "09:00" : (start?.time ?? "09:00"),
  );
  const [to, setTo] = useState(wasAllDay ? "10:00" : (end?.time ?? "10:00"));
  const [allDay, setAllDay] = useState(wasAllDay);
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [shared, setShared] = useState((entry?.visibleTo.length ?? 0) > 0);
  const others = leads.filter((lead) => lead.id !== memberId);
  const isShared = shared && others.length > 0;
  const [tried, setTried] = useState(false);

  const startsAt = fromDateAndTime(day, allDay ? "00:00" : from, timeZone);
  const endsAt = day
    ? fromDateAndTime(
        allDay ? addDayKeys(day, 1) : day,
        allDay ? "00:00" : to,
        timeZone,
      )
    : null;
  const titleProblem = title.trim() ? null : Text.whatRequired;
  const timeProblem =
    startsAt && endsAt && endsAt <= startsAt ? Text.timesWrong : null;

  const save = useMutation({
    mutationFn: () => {
      if (!startsAt || !endsAt) throw new Error("Missing date");
      return savePersonal(
        memberId,
        {
          title,
          notes,
          startsAt,
          endsAt,
          visibleTo: isShared ? others.map((lead) => lead.id) : [],
        },
        entry ? { id: entry.id, createdAt: entry.createdAt } : undefined,
      );
    },
    onSuccess: () => {
      toast.show({
        tone: "success",
        title: entry ? Text.saved(title.trim()) : Text.added(title.trim()),
      });
      onClose();
    },
  });
  const remove = useMutation({
    mutationFn: () => deletePersonal(entry?.id ?? ""),
    onSuccess: () => {
      toast.show({ tone: "success", title: Text.deleted(entry?.title ?? "") });
      onClose();
    },
  });
  const isBusy = save.isPending || remove.isPending;

  return (
    <Modal
      title={entry ? Text.editTitle : Text.addTitle}
      description={Text.description}
      onClose={isBusy ? undefined : onClose}
      footer={
        <>
          {entry ? (
            <Button
              variant="ghost"
              iconStart="trash"
              onClick={() => remove.mutate()}
              isLoading={remove.isPending}
              disabled={save.isPending}
            >
              {Text.delete}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={isBusy}>
            {Text.cancel}
          </Button>
          <Button
            variant="primary"
            isLoading={save.isPending}
            disabled={remove.isPending}
            onClick={() => {
              setTried(true);
              if (!titleProblem && !timeProblem && startsAt && endsAt)
                save.mutate();
            }}
          >
            {entry ? Text.save : Text.addButton}
          </Button>
        </>
      }
    >
      {save.error || remove.error ? (
        <Banner tone="error">
          {dataErrorMessage(save.error ?? remove.error)}
        </Banner>
      ) : null}
      <div className={styles.form}>
        <TextField
          label={Text.what}
          placeholder={Text.whatPlaceholder}
          value={title}
          maxLength={AvailabilityLimits.title}
          onChange={(event) => setTitle(event.target.value)}
          error={tried ? titleProblem : null}
          autoFocus
        />
        <div className={styles.times}>
          <TextField
            label={Text.date}
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
          {allDay ? null : (
            <>
              <TextField
                label={Text.from}
                type="time"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
              <TextField
                label={Text.to}
                type="time"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                error={tried ? timeProblem : null}
              />
            </>
          )}
        </div>
        <Checkbox
          label={Text.allDay}
          checked={allDay}
          onChange={(event) => setAllDay(event.target.checked)}
        />
        <TextArea
          label={Text.notes}
          placeholder={Text.notesPlaceholder}
          value={notes}
          rows={2}
          maxLength={AvailabilityLimits.notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <Checkbox
          label={Text.share}
          description={
            others.length > 0
              ? Text.shareDetail(others.map((lead) => lead.name).join(", "))
              : Text.shareNone
          }
          checked={isShared}
          disabled={others.length === 0}
          onChange={(event) => setShared(event.target.checked)}
        />
        <div className={styles.note}>
          <Icon name="lock" />
          <span>
            <b>{Text.whoSees}.</b> {Text.whoSeesBody(title.trim(), isShared)}{" "}
            {Text.busyNote}
          </span>
        </div>
      </div>
    </Modal>
  );
}
