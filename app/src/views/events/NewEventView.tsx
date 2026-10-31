// File : /TeamSamsara.Workflow/app/src/views/events/NewEventView.tsx
// Version : 1.1.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : Planning an event: its details on the left; on the right the
// workflows to apply (the ones made for its type ticked to start with) and
// the tasks they'll add with their real due times. An event happens once
// unless "Repeat…" is opened. Create makes the event (or the repeat and its
// coming weeks of events) and the tasks together, then opens it.

import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  Navigate,
  useBlocker,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { usePermissions } from "@/core/access";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import { useWorkspaceRecord } from "@/core/workspace";
import {
  applyWorkflows,
  askedGaps,
  checkEventDraft,
  checkRepeatDraft,
  createEvent,
  createRepeat,
  emptyEventDraft,
  EventForm,
  fieldsFromDraft,
  occurrenceId,
  previewRepeat,
  RepeatFields,
  RepeatFieldsText,
  scheduleFromDraft,
  startRepeatDraft,
  TaskPreview,
  weekdayOf,
  WorkflowPicker,
  type EventDraft,
  type RepeatDraft,
} from "@/features/events";
import { useMembers } from "@/features/members";
import {
  startingStatus,
  useEventTypes,
  useStatuses,
} from "@/features/task-setup";
import { formatDue } from "@/features/tasks";
import { useWorkGroups } from "@/features/work-groups";
import { useWorkflows } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { useToast } from "@/shared/components/Toast/useToast";
import { eventPath, RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey, formatDate } from "@/shared/time/dates";
import { dayKeyToDate } from "@/shared/time/monthGrid";
import { NewEventViewText as Text } from "./newEventViewContent";
import styles from "./EventViews.module.css";

export function NewEventView() {
  const access = usePermissions();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const workspace = useWorkspaceRecord();
  const statuses = useStatuses();
  const eventTypes = useEventTypes();
  const groups = useWorkGroups();
  const members = useMembers();
  const workflows = useWorkflows();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [draft, setDraft] = useState<EventDraft>(() =>
    emptyEventDraft(params.get("date") ?? ""),
  );
  const [repeat, setRepeat] = useState<RepeatDraft | null>(null);
  const [pickedIds, setPickedIds] = useState<string[] | null>(null);
  const now = useNow();
  const [tried, setTried] = useState(false);
  const leaving = useRef(false);

  const available = workflows.items.filter((workflow) => !workflow.archived);
  // Until the planner picks, the workflows made for this type are ticked.
  const selectedIds =
    pickedIds ??
    (draft.eventTypeId
      ? available
          .filter((workflow) => workflow.eventTypeId === draft.eventTypeId)
          .map((workflow) => workflow.id)
      : []);
  const selected = available.filter((workflow) =>
    selectedIds.includes(workflow.id),
  );
  const gaps = askedGaps(selected);
  const formats = {
    timeZone: workspace.timeZone,
    clock: workspace.timeFormat,
    dateFormat: workspace.dateFormat,
  };
  const fields = fieldsFromDraft(draft, workspace.timeZone);
  const planned = applyWorkflows(
    {
      title: draft.title,
      startsAt: fields?.startsAt ?? new Date(),
      link: draft.link || null,
      details: draft.details,
    },
    selected,
    formats,
  );
  const problems = checkEventDraft(draft);
  const startId = startingStatus(statuses.items)?.id ?? null;
  const today = dayKey(now, workspace.timeZone);
  const schedule = repeat
    ? scheduleFromDraft(repeat, draft.date, draft.time)
    : null;
  const repeatProblems = repeat ? checkRepeatDraft(repeat, draft.date) : null;
  // Null until there's a first date and a schedule that makes sense.
  const upcoming =
    schedule && draft.date && repeatProblems?.count === 0
      ? previewRepeat(schedule, today)
      : null;
  const dayLabel = (key: string) =>
    formatDate(dayKeyToDate(key), "UTC", workspace.dateFormat);

  function changeDraft(changes: Partial<EventDraft>) {
    // A repeat on the first date's weekday follows the date when it changes.
    if (
      repeat &&
      changes.date &&
      draft.date &&
      repeat.weekdays.length === 1 &&
      repeat.weekdays[0] === weekdayOf(draft.date)
    )
      setRepeat({ ...repeat, weekdays: [weekdayOf(changes.date)] });
    setDraft((current) => ({ ...current, ...changes }));
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!fields || !member) throw new Error("Missing date");
      const options = {
        workflows: selected,
        formats,
        startingStatusId: startId ?? "",
        createdBy: member.id,
      };
      if (!schedule) return eventPath(await createEvent(fields, options));
      const repeatId = await createRepeat(fields, schedule, selected, {
        ...options,
        today,
      });
      return upcoming && upcoming.length > 0
        ? eventPath(occurrenceId(repeatId, upcoming[0]))
        : RoutePaths.calendar;
    },
    onSuccess: (path) => {
      toast.show({
        tone: "success",
        title: schedule
          ? Text.createdRepeat(draft.title.trim())
          : Text.created(draft.title.trim()),
      });
      leaving.current = true;
      navigate(path, { replace: true });
    },
  });

  const hasInput = draft.title.trim() !== "" || selectedIds.length > 0;
  const blocker = useBlocker(
    () => !leaving.current && hasInput && !create.isPending,
  );

  if (!access.can("planEvents"))
    return <Navigate to={RoutePaths.calendar} replace />;

  function submit() {
    setTried(true);
    if (
      problems.count > 0 ||
      (repeatProblems?.count ?? 0) > 0 ||
      (planned.length > 0 && !startId)
    )
      return;
    create.mutate();
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        breadcrumbs={[
          { label: Text.calendar, to: RoutePaths.calendar },
          { label: Text.title },
        ]}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => navigate(RoutePaths.calendar)}
              disabled={create.isPending}
            >
              {Text.cancel}
            </Button>
            <Button
              variant="primary"
              iconStart="add"
              onClick={submit}
              isLoading={create.isPending}
            >
              {!repeat
                ? Text.create(planned.length)
                : upcoming && upcoming.length > 0
                  ? Text.createRepeat(
                      upcoming.length,
                      planned.length * upcoming.length,
                    )
                  : Text.createRepeatPlain}
            </Button>
          </>
        }
      />
      {tried && problems.count + (repeatProblems?.count ?? 0) > 0 ? (
        <Banner tone="error">{Text.problems}</Banner>
      ) : null}
      {planned.length > 0 && !startId ? (
        <Banner tone="alert">{Text.noStatuses}</Banner>
      ) : null}
      {create.error ? (
        <Banner tone="error">
          {Text.failed}: {dataErrorMessage(create.error)}
        </Banner>
      ) : null}

      <div className={styles.columns}>
        <section className={styles.mainCard} aria-label={Text.event}>
          <EventForm
            draft={draft}
            onChange={changeDraft}
            eventTypes={eventTypes.items}
            gaps={gaps}
            problems={tried ? problems : null}
          />
          {repeat ? (
            <RepeatFields
              draft={repeat}
              onChange={(changes) => setRepeat({ ...repeat, ...changes })}
              onRemove={() => setRepeat(null)}
              weekStartsOn={workspace.weekStartsOn}
              upcoming={upcoming}
              dayLabel={dayLabel}
              problems={tried ? repeatProblems : null}
            />
          ) : (
            <div className={styles.repeatAdd}>
              <Button
                variant="ghost"
                iconStart="repeat"
                onClick={() => setRepeat(startRepeatDraft(draft.date))}
              >
                {RepeatFieldsText.add}
              </Button>
              <span className={styles.muted}>{RepeatFieldsText.addHelp}</span>
            </div>
          )}
        </section>
        <div className={styles.side}>
          <WorkflowPicker
            workflows={available}
            selectedIds={selectedIds}
            onChange={setPickedIds}
            eventTypeId={draft.eventTypeId}
            groups={groups.items.map((item) => item.group)}
          />
          <TaskPreview
            tasks={planned}
            hasDate={fields !== null}
            groups={groups.items.map((item) => item.group)}
            members={members.records}
            formatDue={(dueAt) =>
              formatDue(
                dueAt,
                workspace.timeZone,
                workspace.timeFormat,
                workspace.dateFormat,
              )
            }
          />
        </div>
      </div>

      {blocker.state === "blocked" ? (
        <Modal
          title={Text.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {Text.discard.keep}
              </Button>
              <Button variant="danger" onClick={() => blocker.proceed()}>
                {Text.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{Text.discard.body}</p>
        </Modal>
      ) : null}
    </div>
  );
}
