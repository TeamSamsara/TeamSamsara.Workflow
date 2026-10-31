// File : /TeamSamsara.Workflow/app/src/views/events/EventView.tsx
// Version : 1.1.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : An event's page: when and what it is, its tasks and how far along
// they are, its details and the repeat it's part of. Planners change it from
// its ⋯ menu (the same as on the calendar) and add tasks to it.

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { DataErrorText, isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useWorkspaceRecord } from "@/core/workspace";
import {
  describeRepeat,
  EventActions,
  gapLabel,
  useEvent,
  useEventTasks,
  useRepeats,
  useSeesEventTasks,
  type EventRecord,
} from "@/features/events";
import { useMembers } from "@/features/members";
import { usePlatforms } from "@/features/platforms";
import {
  startingStatus,
  useEventTypes,
  useStatuses,
  useTags,
} from "@/features/task-setup";
import {
  formatDue,
  NewTaskDialog,
  TaskGroupCard,
  type TaskListContext,
} from "@/features/tasks";
import { useWorkGroups } from "@/features/work-groups";
import { useWorkflows } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Chip } from "@/shared/components/Chip/Chip";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths, taskPath } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { Icon } from "@/shared/icons/Icon";
import { formatLongDate, formatTime } from "@/shared/time/dates";
import { EventViewText as Text } from "./eventViewContent";
import styles from "./EventViews.module.css";
import panels from "./EventDetails.module.css";

function EventPage({ event }: { event: EventRecord }) {
  const access = usePermissions();
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const workspace = useWorkspaceRecord();
  const statuses = useStatuses();
  const eventTypes = useEventTypes();
  const groups = useWorkGroups();
  const members = useMembers();
  const tags = useTags();
  const platforms = usePlatforms();
  const workflows = useWorkflows();
  const seesAll = useSeesEventTasks();
  const repeats = useRepeats();
  const tasks = useEventTasks(event.id, member);
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow();
  const [isAddingTask, setIsAddingTask] = useState(false);

  const tz = workspace.timeZone;
  const canPlan = access.can("planEvents");
  const type = eventTypes.items.find((entry) => entry.id === event.eventTypeId);
  const repeat = event.repeatId
    ? (repeats.find((entry) => entry.id === event.repeatId) ?? null)
    : null;
  const done = tasks.items.filter((task) => task.doneAt).length;
  const usedWorkflows = workflows.items.filter((workflow) =>
    event.workflowIds.includes(workflow.id),
  );
  const context: TaskListContext = {
    statuses: statuses.items,
    groups: groups.items.map((item) => item.group),
    members: members.records,
    formatDue: (dueAt) =>
      formatDue(dueAt, tz, workspace.timeFormat, workspace.dateFormat, now),
    hrefFor: taskPath,
    now,
  };

  return (
    <>
      <PageHeader
        title={event.title}
        breadcrumbs={[
          { label: Text.calendar, to: RoutePaths.calendar },
          { label: event.title },
        ]}
        description={
          <span className={styles.meta}>
            {type ? <Chip label={type.name} color={type.color} /> : null}
            <span className={styles.when}>
              <Icon name="calendar" />
              {formatLongDate(event.startsAt, tz)},{" "}
              {formatTime(event.startsAt, tz, workspace.timeFormat)}
            </span>
            {event.link ? (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className={panels.link}
              >
                <Icon name="externalLink" />
                {Text.openLink}
              </a>
            ) : null}
          </span>
        }
        actions={
          canPlan ? (
            <>
              <EventActions
                event={event}
                repeat={repeat}
                look="header"
                onGone={() => navigate(RoutePaths.calendar, { replace: true })}
              />
              <Button
                variant="primary"
                iconStart="add"
                onClick={() => setIsAddingTask(true)}
              >
                {Text.addTask}
              </Button>
            </>
          ) : null
        }
      />

      <div className={styles.columns}>
        <div className={styles.main}>
          {!seesAll ? <Banner tone="info">{Text.limited}</Banner> : null}
          {tasks.status === "error" ? (
            <Banner tone="error">
              {DataErrorText[tasks.error ?? "unknown"]}
            </Banner>
          ) : tasks.status === "loading" ? (
            <div className={styles.loading}>
              <Spinner label={Text.loading} />
            </div>
          ) : tasks.items.length === 0 ? (
            <p className={panels.empty}>{Text.noTasks}</p>
          ) : (
            <TaskGroupCard
              title={Text.tasks}
              note={Text.progress(done, tasks.items.length)}
              tasks={tasks.items}
              context={context}
            />
          )}
        </div>
        <aside className={styles.side}>
          <section className={panels.card} aria-labelledby="event-details">
            <h2 id="event-details" className={panels.title}>
              {Text.details}
            </h2>
            <dl className={panels.details}>
              <dt>{Text.type}</dt>
              <dd>{type?.name ?? Text.noType}</dd>
              {event.link ? (
                <>
                  <dt>{Text.link}</dt>
                  <dd>
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {event.link}
                    </a>
                  </dd>
                </>
              ) : null}
              {Object.entries(event.details).map(([gap, value]) => (
                <span key={gap} className={panels.pair}>
                  <dt>{gapLabel(gap)}</dt>
                  <dd>{value}</dd>
                </span>
              ))}
              <dt>{Text.workflows}</dt>
              <dd>
                {usedWorkflows.length > 0
                  ? usedWorkflows.map((workflow) => workflow.name).join(", ")
                  : Text.noWorkflows}
              </dd>
            </dl>
            {event.notes ? (
              <>
                <h3 className={panels.subtitle}>{Text.notes}</h3>
                <p className={panels.notes}>{event.notes}</p>
              </>
            ) : null}
          </section>
          {repeat ? (
            <section className={panels.card} aria-labelledby="event-repeat">
              <h2 id="event-repeat" className={panels.title}>
                <Icon name="repeat" /> {Text.repeat}
              </h2>
              <p className={styles.text}>
                {describeRepeat(
                  repeat,
                  workspace.timeFormat,
                  workspace.dateFormat,
                  workspace.weekStartsOn,
                )}
              </p>
              {canPlan ? (
                <p className={panels.muted}>{Text.repeatHelp}</p>
              ) : null}
            </section>
          ) : null}
        </aside>
      </div>

      {isAddingTask && member ? (
        <NewTaskDialog
          options={{
            groups: groups.items.map((item) => item.group),
            members: members.records.filter(isCurrentMember),
            tags: tags.items,
            platforms: platforms.settings,
          }}
          timeZone={tz}
          startingStatusId={startingStatus(statuses.items)?.id ?? null}
          createdBy={member.id}
          origin={{ eventId: event.id, workflowId: null, stepId: null }}
          onClose={() => setIsAddingTask(false)}
          onCreated={(_taskId, title) => {
            toast.show({ tone: "success", title: Text.taskAdded(title) });
            setIsAddingTask(false);
          }}
        />
      ) : null}
    </>
  );
}

export function EventView() {
  const { eventId } = useParams();
  const event = useEvent(eventId);

  return (
    <div className={styles.page}>
      {event === undefined ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : event === null ? (
        <div className={styles.missing}>
          <Banner tone="info">{Text.notFound}</Banner>
          <LinkButton to={RoutePaths.calendar} iconStart="back" variant="ghost">
            {Text.back}
          </LinkButton>
        </div>
      ) : (
        <EventPage key={event.id} event={event} />
      )}
    </div>
  );
}
