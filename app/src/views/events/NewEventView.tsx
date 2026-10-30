// File : /TeamSamsara.Workflow/app/src/views/events/NewEventView.tsx
// Version : 1.0.0
// Latest commit: feature/calendar-events
// Author : Gerrah
// Purpose : Planning an event: its details on the left; on the right the
// workflows to apply (the ones made for its type ticked to start with) and
// the tasks they'll add with their real due times. Create makes the event and
// its tasks together, then opens it.

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
  createEvent,
  emptyEventDraft,
  EventForm,
  fieldsFromDraft,
  TaskPreview,
  WorkflowPicker,
  type EventDraft,
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
  const [pickedIds, setPickedIds] = useState<string[] | null>(null);
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

  const create = useMutation({
    mutationFn: () => {
      if (!fields || !member) throw new Error("Missing date");
      return createEvent(fields, {
        workflows: selected,
        formats,
        startingStatusId: startId ?? "",
        createdBy: member.id,
      });
    },
    onSuccess: (eventId) => {
      toast.show({ tone: "success", title: Text.created(draft.title.trim()) });
      leaving.current = true;
      navigate(eventPath(eventId), { replace: true });
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
    if (problems.count > 0 || (planned.length > 0 && !startId)) return;
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
              {Text.create(planned.length)}
            </Button>
          </>
        }
      />
      {tried && problems.count > 0 ? (
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
            onChange={(changes) =>
              setDraft((current) => ({ ...current, ...changes }))
            }
            eventTypes={eventTypes.items}
            gaps={gaps}
            problems={tried ? problems : null}
          />
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
