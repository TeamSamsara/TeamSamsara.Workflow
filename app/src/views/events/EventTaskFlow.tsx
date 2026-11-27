// File : /TeamSamsara.Workflow/app/src/views/events/EventTaskFlow.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-flow-view
// Author : Gerrah
// Purpose : An event's tasks as a flow, in time order: one column per due
// time with the event's start marked, each task with its group and who has
// it (or that it's waiting for someone in the group) and its status, and the
// links from what each one waits on. A task still waiting on others is
// dashed and says Waiting. Picking a task opens it.

import { lockState } from "@engine/order";
import { useNavigate } from "react-router-dom";
import { memberName } from "@/features/members";
import { StatusPill } from "@/features/task-setup";
import {
  statusOf,
  taskFlow,
  type TaskListContext,
  type TaskRecord,
} from "@/features/tasks";
import { FlowChart, FlowLegend } from "@/features/workflows";
import { Pill } from "@/shared/components/Pill/Pill";
import {
  formatShortDate,
  formatTime,
  type ClockFormat,
} from "@/shared/time/dates";
import { EventViewText as Text } from "./eventViewContent";
import styles from "./EventViews.module.css";

interface EventTaskFlowProps {
  tasks: readonly TaskRecord[];
  startsAt: Date;
  context: TaskListContext;
  timeZone: string;
  clockFormat: ClockFormat;
}

export function EventTaskFlow({
  tasks,
  startsAt,
  context,
  timeZone,
  clockFormat,
}: EventTaskFlowProps) {
  const navigate = useNavigate();
  const flow = taskFlow(tasks, startsAt);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  });
  const columns = flow.columns.map((at) =>
    at
      ? `${weekday.format(at)}, ${formatShortDate(at, timeZone, context.now)} · ${formatTime(at, timeZone, clockFormat)}`
      : Text.flow.noDue,
  );

  return (
    <section className={styles.flow} aria-label={Text.flow.label}>
      <FlowLegend
        showBad={false}
        extra={<span className={styles.flowKey}>{Text.flow.waitingKey}</span>}
      />
      <FlowChart
        label={Text.flow.label}
        columns={columns}
        startsBefore={flow.startsBefore}
        links={flow.links}
        onSelect={(taskId) => navigate(context.hrefFor(taskId))}
        nodes={tasks.map((task) => {
          const group = context.groups.find(
            (entry) => entry.id === task.workGroupId,
          );
          const member = context.members.find(
            (entry) => entry.id === task.memberId,
          );
          const done = task.doneAt !== null;
          const waiting = !done && lockState(task, context.now).locked;
          const status = statusOf(task, context.statuses);
          return {
            id: task.id,
            column: flow.columnOf[task.id] ?? 0,
            title: task.title,
            meta: [
              group?.name ?? null,
              member
                ? memberName(member)
                : group
                  ? Text.flow.waitingForSomeone(group.name)
                  : Text.flow.unassigned,
            ].filter(Boolean),
            badge: waiting ? (
              <Pill tone="muted">{Text.flow.waiting}</Pill>
            ) : status ? (
              <StatusPill status={status} />
            ) : null,
            waiting,
          };
        })}
      />
    </section>
  );
}
