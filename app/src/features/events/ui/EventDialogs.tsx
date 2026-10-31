// File : /TeamSamsara.Workflow/app/src/features/events/ui/EventDialogs.tsx
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : The dialogs behind an event's ⋯ menu: edit it (moving its tasks
// when its time changes), edit a repeat from this date on, delete it, skip one
// date of a repeat, and end a repeat after this date. Each reads the event's
// tasks itself, so they open the same from the calendar and the event's page.

import { useMutation } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import { useWorkspaceRecord } from "@/core/workspace";
import {
  startingStatus,
  useEventTypes,
  useStatuses,
} from "@/features/task-setup";
import { useWorkflows } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey, formatDate } from "@/shared/time/dates";
import { dayKeyToDate } from "@/shared/time/monthGrid";
import { useEventTasks } from "../hooks/useEvents";
import { askedGaps } from "../model/applyWorkflows";
import {
  checkEventDraft,
  draftFromEvent,
  fieldsFromDraft,
  type EventDraft,
} from "../model/eventDraft";
import {
  checkRepeatDraft,
  draftFromRepeat,
  scheduleFromDraft,
  type RepeatDraft,
} from "../model/repeatDraft";
import { addDays, repeatDates } from "../model/repeatRule";
import { deleteEvent, saveEvent } from "../service/eventService";
import {
  editSeriesFrom,
  endRepeatAfter,
  previewRepeat,
  skipOccurrence,
} from "../service/repeatService";
import type { EventRecord } from "../types/eventTypes";
import { RepeatLimits, type RepeatRecord } from "../types/repeatTypes";
import { EventForm } from "./EventForm";
import { EventActionsText as Text } from "./eventActionsContent";
import { RepeatFields } from "./RepeatFields";
import styles from "./EventDialogs.module.css";

function useDayLabel() {
  const workspace = useWorkspaceRecord();
  return (key: string) =>
    formatDate(dayKeyToDate(key), "UTC", workspace.dateFormat);
}

function useTasksOf(event: EventRecord) {
  const session = useSession();
  return useEventTasks(
    event.id,
    session.status === "active" ? session.member : null,
  );
}

/** The gaps to ask for: the ones filled in already and the ones its workflows have. */
function useGaps(
  details: Record<string, string>,
  workflowIds: readonly string[],
) {
  const workflows = useWorkflows();
  const used = workflows.items.filter((workflow) =>
    workflowIds.includes(workflow.id),
  );
  return [...new Set([...Object.keys(details), ...askedGaps(used)])].sort();
}

interface ConfirmProps {
  title: string;
  body: ReactNode;
  confirm: string;
  icon: "trash" | "skip" | "repeat";
  isPending: boolean;
  isReady: boolean;
  error: unknown;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmDialog({
  title,
  body,
  confirm,
  icon,
  isPending,
  isReady,
  error,
  onConfirm,
  onClose,
}: ConfirmProps) {
  return (
    <Modal
      title={title}
      onClose={isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {Text.cancel}
          </Button>
          <Button
            variant="danger"
            iconStart={icon}
            isLoading={isPending}
            disabled={!isReady}
            onClick={onConfirm}
          >
            {confirm}
          </Button>
        </>
      }
    >
      {error ? <Banner tone="error">{dataErrorMessage(error)}</Banner> : null}
      <p className={styles.text}>{isReady ? body : Text.loadingTasks}</p>
    </Modal>
  );
}

interface EditEventDialogProps {
  event: EventRecord;
  /** One date of a repeat: only it changes. */
  isOccurrence: boolean;
  onClose: () => void;
}

export function EditEventDialog({
  event,
  isOccurrence,
  onClose,
}: EditEventDialogProps) {
  const workspace = useWorkspaceRecord();
  const eventTypes = useEventTypes();
  const tasks = useTasksOf(event);
  const gaps = useGaps(event.details, event.workflowIds);
  const toast = useToast();
  const [draft, setDraft] = useState<EventDraft>(() =>
    draftFromEvent(event, workspace.timeZone),
  );
  const [moveTasks, setMoveTasks] = useState(true);
  const [tried, setTried] = useState(false);
  const problems = checkEventDraft(draft);
  const fields = fieldsFromDraft(draft, workspace.timeZone);
  const moved =
    fields !== null && fields.startsAt.getTime() !== event.startsAt.getTime();

  const save = useMutation({
    mutationFn: () => {
      if (!fields) throw new Error("Missing date");
      return saveEvent(
        event.id,
        fields,
        event.startsAt,
        moveTasks ? tasks.items : [],
      );
    },
    onSuccess: () => {
      toast.show({ tone: "success", title: Text.saved(draft.title.trim()) });
      onClose();
    },
  });

  return (
    <Modal
      title={isOccurrence ? Text.editDialog.titleOne : Text.editDialog.title}
      description={isOccurrence ? Text.editDialog.oneNote : undefined}
      size="wide"
      onClose={save.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {Text.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (problems.count === 0) save.mutate();
            }}
            isLoading={save.isPending}
            disabled={moved && moveTasks && tasks.status === "loading"}
          >
            {Text.editDialog.save}
          </Button>
        </>
      }
    >
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      <EventForm
        draft={draft}
        onChange={(changes) =>
          setDraft((current) => ({ ...current, ...changes }))
        }
        eventTypes={eventTypes.items}
        gaps={gaps}
        problems={tried ? problems : null}
      />
      {moved && tasks.items.length > 0 ? (
        <Checkbox
          label={Text.editDialog.moveTasks}
          help={Text.editDialog.moveTasksHelp}
          checked={moveTasks}
          onChange={(change) => setMoveTasks(change.target.checked)}
        />
      ) : null}
    </Modal>
  );
}

interface SeriesDialogProps {
  repeat: RepeatRecord;
  /** The date the changes start from: the event the menu was opened on. */
  fromDay: string;
  onClose: () => void;
}

export function EditSeriesDialog({
  repeat,
  fromDay,
  onClose,
}: SeriesDialogProps) {
  const workspace = useWorkspaceRecord();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const eventTypes = useEventTypes();
  const statuses = useStatuses();
  const workflows = useWorkflows();
  const gaps = useGaps(repeat.details, repeat.workflowIds);
  const toast = useToast();
  const dayLabel = useDayLabel();
  const today = dayKey(useNow(), workspace.timeZone);
  const [draft, setDraft] = useState<EventDraft>(() => ({
    title: repeat.title,
    eventTypeId: repeat.eventTypeId,
    date: fromDay,
    time: repeat.time,
    link: repeat.link ?? "",
    notes: repeat.notes,
    details: repeat.details,
  }));
  const [schedule, setSchedule] = useState<RepeatDraft>(() =>
    draftFromRepeat(repeat),
  );
  const [tried, setTried] = useState(false);
  const problems = checkEventDraft(draft);
  const scheduleProblems = checkRepeatDraft(schedule, fromDay);
  const next = scheduleFromDraft(schedule, fromDay, draft.time);
  const startId = startingStatus(statuses.items)?.id ?? null;

  const save = useMutation({
    mutationFn: () => {
      if (!member) throw new Error("Not signed in");
      return editSeriesFrom(
        repeat,
        fromDay,
        {
          title: draft.title,
          eventTypeId: draft.eventTypeId,
          link: draft.link.trim() || null,
          details: draft.details,
          notes: draft.notes,
        },
        next,
        {
          workflows: workflows.items,
          formats: {
            timeZone: workspace.timeZone,
            clock: workspace.timeFormat,
            dateFormat: workspace.dateFormat,
          },
          startingStatusId: startId ?? "",
          createdBy: member.id,
          today,
        },
      );
    },
    onSuccess: () => {
      toast.show({
        tone: "success",
        title: Text.savedSeries(draft.title.trim()),
      });
      onClose();
    },
  });

  return (
    <Modal
      title={Text.seriesDialog.title}
      description={Text.seriesDialog.from(dayLabel(fromDay))}
      size="wide"
      onClose={save.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {Text.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (problems.count + scheduleProblems.count === 0) save.mutate();
            }}
            isLoading={save.isPending}
          >
            {Text.seriesDialog.save}
          </Button>
        </>
      }
    >
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      <EventForm
        draft={draft}
        onChange={(changes) =>
          setDraft((current) => ({ ...current, ...changes }))
        }
        eventTypes={eventTypes.items}
        gaps={gaps}
        problems={tried ? problems : null}
        hideDate
        autoFocus={false}
      />
      <RepeatFields
        draft={schedule}
        onChange={(changes) =>
          setSchedule((current) => ({ ...current, ...changes }))
        }
        weekStartsOn={workspace.weekStartsOn}
        upcoming={
          scheduleProblems.count === 0 ? previewRepeat(next, today) : null
        }
        dayLabel={dayLabel}
        problems={tried ? scheduleProblems : null}
      />
      <p className={styles.muted}>{Text.seriesDialog.moves}</p>
    </Modal>
  );
}

interface GoneProps {
  event: EventRecord;
  onClose: () => void;
  /** Called once it's gone, e.g. to leave its page. */
  onGone?: () => void;
}

export function DeleteEventDialog({ event, onClose, onGone }: GoneProps) {
  const tasks = useTasksOf(event);
  const toast = useToast();
  const remove = useMutation({
    mutationFn: () =>
      deleteEvent(
        event.id,
        tasks.items.map((task) => task.id),
      ),
    onSuccess: () => {
      toast.show({ tone: "success", title: Text.deleted(event.title) });
      onClose();
      onGone?.();
    },
  });
  return (
    <ConfirmDialog
      title={Text.deleteDialog.title(event.title)}
      body={Text.deleteDialog.body(tasks.items.length)}
      confirm={Text.deleteDialog.confirm}
      icon="trash"
      isPending={remove.isPending}
      isReady={tasks.status !== "loading"}
      error={remove.error}
      onConfirm={() => remove.mutate()}
      onClose={onClose}
    />
  );
}

interface OccurrenceProps extends GoneProps {
  repeat: RepeatRecord;
  date: string;
}

export function SkipDialog({
  event,
  repeat,
  date,
  asDelete,
  onClose,
  onGone,
}: OccurrenceProps & { asDelete: boolean }) {
  const tasks = useTasksOf(event);
  const toast = useToast();
  const label = useDayLabel()(date);
  const skip = useMutation({
    mutationFn: () => skipOccurrence(repeat.id, date),
    onSuccess: () => {
      toast.show({ tone: "success", title: Text.skipped(label) });
      onClose();
      onGone?.();
    },
  });
  return (
    <ConfirmDialog
      title={
        asDelete
          ? Text.skipDialog.titleDelete(label)
          : Text.skipDialog.title(label)
      }
      body={Text.skipDialog.body(tasks.items.length)}
      confirm={
        asDelete ? Text.skipDialog.confirmDelete : Text.skipDialog.confirm
      }
      icon={asDelete ? "trash" : "skip"}
      isPending={skip.isPending}
      isReady={tasks.status !== "loading"}
      error={skip.error}
      onConfirm={() => skip.mutate()}
      onClose={onClose}
    />
  );
}

export function EndRepeatDialog({
  repeat,
  date,
  onClose,
}: Omit<OccurrenceProps, "event" | "onGone">) {
  const workspace = useWorkspaceRecord();
  const today = dayKey(useNow(), workspace.timeZone);
  const label = useDayLabel()(date);
  const toast = useToast();
  const later = repeatDates(
    repeat,
    addDays(date, 1),
    addDays(today, RepeatLimits.weeksAhead * 7),
  ).length;
  const end = useMutation({
    mutationFn: () => endRepeatAfter(repeat.id, date),
    onSuccess: () => {
      toast.show({ tone: "success", title: Text.ended(label) });
      onClose();
    },
  });
  return (
    <ConfirmDialog
      title={Text.endDialog.title}
      body={Text.endDialog.body(label, later)}
      confirm={Text.endDialog.confirm}
      icon="repeat"
      isPending={end.isPending}
      isReady
      error={end.error}
      onConfirm={() => end.mutate()}
      onClose={onClose}
    />
  );
}
