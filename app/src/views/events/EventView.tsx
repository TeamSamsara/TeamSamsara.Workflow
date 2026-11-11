// File : /TeamSamsara.Workflow/app/src/views/events/EventView.tsx
// Version : 1.7.1
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : An event's page: when and what it is, its tasks and how far along
// they are, its details, and the repeat or set it's part of. Planners change it from
// its ⋯ menu (the same as on the calendar) and add tasks to it.

import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { DataErrorText, isCurrentMember } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import { fieldText } from "@/features/fields";
import {
  describeRepeat,
  EventActions,
  gapLabel,
  useEvent,
  useEventSet,
  useEventTasks,
  useTaskOrder,
  useAudienceOptions,
  useRepeat,
  useSeesEventTasks,
  AudienceText,
  type EventRecord,
  useTaskFormats,
  AttendanceCard,
  ReplyCard,
  isAsked,
  useReplyFromLink,
  type AttendancePerson,
} from "@/features/events";
import { memberName, useMembers } from "@/features/members";
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
import {
  eventSetPath,
  RoutePaths,
  taskPath,
} from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { Icon } from "@/shared/icons/Icon";
import { formatLongDate, formatTime } from "@/shared/time/dates";
import { zoneCity } from "@/shared/time/timeZones";
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
  const people = useAudienceOptions();
  const tasks = useEventTasks(event.id, member);
  const flow = event.workflowIds;
  const inOrder = useTaskOrder(useCallback(() => flow, [flow]));
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow();
  const [isAddingTask, setIsAddingTask] = useState(false);
  useReplyFromLink(event, member);

  const time = useDisplayTime();
  const taskFormats = useTaskFormats();
  const tz = time.timeZone;
  const canPlan = access.can("planEvents");
  const type = eventTypes.items.find((entry) => entry.id === event.eventTypeId);
  const repeat = useRepeat(event.repeatId);
  const set = useEventSet(event.setId);
  const opensSets = canPlan || access.can("viewAll");
  const audience = [
    ...(event.everyone ? [AudienceText.everyone] : []),
    ...event.groupIds.map(
      (id) => people.groups.find((group) => group.id === id)?.name ?? "",
    ),
    ...event.memberIds.map(
      (id) => people.members.find((member) => member.id === id)?.name ?? "",
    ),
  ].filter(Boolean);
  const done = tasks.items.filter((task) => task.doneAt).length;
  const attendees: AttendancePerson[] = members.records
    .filter((entry) => entry.status === "active" || entry.status === "invited")
    .map((entry) => ({
      id: entry.id,
      name: memberName(entry),
      photoUrl: entry.photoUrl,
      workGroupIds: entry.workGroupIds,
    }));
  const planner = members.records.find((entry) => entry.id === event.createdBy);
  const usedWorkflows = workflows.items.filter((workflow) =>
    event.workflowIds.includes(workflow.id),
  );
  const context: TaskListContext = {
    statuses: statuses.items,
    groups: groups.items.map((item) => item.group),
    members: members.records,
    formatDue: (dueAt) =>
      formatDue(dueAt, tz, time.timeFormat, time.dateFormat, now),
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
              {formatTime(event.startsAt, tz, time.timeFormat)} –{" "}
              {formatTime(event.endsAt, tz, time.timeFormat)}
            </span>
            {time.isOwnZone ? (
              <span className={styles.when}>
                {Text.plannedAs(
                  `${formatTime(event.startsAt, workspace.timeZone, time.timeFormat)} – ${formatTime(event.endsAt, workspace.timeZone, time.timeFormat)}`,
                  zoneCity(workspace.timeZone),
                )}
              </span>
            ) : null}
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
          {member && isAsked(event, member) ? (
            <ReplyCard
              event={event}
              memberId={member.id}
              plannerName={planner ? memberName(planner) : null}
            />
          ) : null}
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
              tasks={inOrder(tasks.items)}
              context={context}
            />
          )}
        </div>
        <aside className={styles.side}>
          {event.asksReply ? (
            <AttendanceCard
              event={event}
              people={attendees}
              meId={member?.id ?? null}
              canRemind={canPlan}
              timeZone={tz}
              now={now}
            />
          ) : null}
          <section className={panels.card} aria-labelledby="event-details">
            <h2 id="event-details" className={panels.title}>
              {Text.details}
            </h2>
            <dl className={panels.details}>
              <dt>{Text.audience}</dt>
              <dd>
                {audience.length > 0
                  ? audience.join(", ")
                  : AudienceText.nobody}
              </dd>
              <dt>{Text.type}</dt>
              <dd>{type?.name ?? Text.noType}</dd>
              {set ? (
                <>
                  <dt>{Text.partOf}</dt>
                  <dd>
                    {opensSets ? (
                      <Link to={eventSetPath(set.id)}>{set.name}</Link>
                    ) : (
                      set.name
                    )}
                  </dd>
                </>
              ) : null}
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
              {Object.entries(event.details)
                .filter(([, value]) => value.trim())
                .map(([gap, value]) => (
                  <span key={gap} className={panels.pair}>
                    <dt>{gapLabel(gap, taskFormats.fields)}</dt>
                    <dd>
                      {fieldText(
                        taskFormats.fields?.find((field) => field.id === gap),
                        value,
                        {
                          ...taskFormats,
                          dateFormat: time.dateFormat,
                          clock: time.timeFormat,
                        },
                      )}
                    </dd>
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
                  time.timeFormat,
                  time.dateFormat,
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
          timeZone={workspace.timeZone}
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
