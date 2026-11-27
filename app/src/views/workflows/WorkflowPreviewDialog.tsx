// File : /TeamSamsara.Workflow/app/src/views/workflows/WorkflowPreviewDialog.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-preview-date
// Author : Gerrah
// Purpose : Preview on a date: the tasks the workflow, as it stands in the
// editor, would make for an event starting then. They show as a flow with
// real dates, each with who gets it and how full their week already is;
// above them, the tasks that would already be late and the groups it would
// push over their usual week. Nothing is created.

import { dayKey, fromWallTime } from "@engine/time";
import { weekOf, weekState, type WeekState } from "@engine/workload";
import { useState } from "react";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import { applyWorkflows, useTaskFormats } from "@/features/events";
import { taskFlow } from "@/features/tasks";
import {
  FlowChart,
  FlowLegend,
  type StepEditorOptions,
  type WorkflowFields,
} from "@/features/workflows";
import {
  stateAt,
  useGroupWeeks,
  useMemberWeeks,
  WeekPill,
  workloadWarnings,
  WorkloadWarningNotice,
} from "@/features/workload";
import { memberName } from "@/features/members";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { useNow } from "@/shared/hooks/useNow";
import { formatShortDate, formatTime } from "@/shared/time/dates";
import { WorkflowEditViewText } from "./workflowEditViewContent";
import styles from "./WorkflowEditView.module.css";

const Text = WorkflowEditViewText.preview;
const weekMs = 7 * 24 * 3600 * 1000;

/** "2026-11-17" and "19:00" in a time zone → the moment, or null. */
function startOf(date: string, time: string, timeZone: string): Date | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  if (!day || !clock) return null;
  return fromWallTime(
    {
      year: Number(day[1]),
      month: Number(day[2]),
      day: Number(day[3]),
      hour: Number(clock[1]),
      minute: Number(clock[2]),
    },
    timeZone,
  );
}

interface WorkflowPreviewDialogProps {
  workflowId: string | null;
  fields: WorkflowFields;
  options: StepEditorOptions;
  onClose: () => void;
}

export function WorkflowPreviewDialog({
  workflowId,
  fields,
  options,
  onClose,
}: WorkflowPreviewDialogProps) {
  const workspace = useWorkspaceRecord();
  const time = useDisplayTime();
  const formats = useTaskFormats();
  const now = useNow();
  const tz = workspace.timeZone;
  const [date, setDate] = useState(() =>
    dayKey(new Date(now.getTime() + weekMs), tz),
  );
  const [clock, setClock] = useState("19:00");
  const startsAt = startOf(date, clock, tz);

  const planned = startsAt
    ? applyWorkflows(
        {
          title: Text.eventTitle,
          startsAt,
          eventTypeId: fields.eventTypeId,
          link: null,
          details: {},
        },
        [
          {
            id: workflowId ?? "preview",
            name: fields.name,
            description: fields.description,
            eventTypeId: fields.eventTypeId,
            archived: false,
            steps: fields.steps,
            createdAt: null,
            updatedAt: null,
          },
        ],
        formats,
      )
    : [];
  const groupWeeks = useGroupWeeks(options.groups.map((group) => group.id));
  const memberWeeks = useMemberWeeks(
    planned.flatMap((task) => (task.memberId ? [task.memberId] : [])),
  );
  const warnings = workloadWarnings(planned, groupWeeks, workspace);
  const late = planned.filter(
    (task) => task.dueAt && task.dueAt.getTime() < now.getTime(),
  );

  // How full a group's or a person's week already is, the week a task is due.
  const weekBefore = (task: (typeof planned)[number]): WeekState | null => {
    if (!task.dueAt) return null;
    if (task.memberId)
      return stateAt(memberWeeks.get(task.memberId), task.dueAt, workspace);
    const group = task.workGroupId ? groupWeeks.get(task.workGroupId) : null;
    if (!group || group.usualWeek === null) return null;
    const start = weekOf(task.dueAt, tz, workspace.weekStartsOn).start;
    return weekState(
      group.usualWeek,
      group.loads[dayKey(start, tz)] ?? group.base,
    );
  };

  const flow = startsAt
    ? taskFlow(
        planned.map((task) => ({
          id: task.stepId,
          workflowId: task.workflowId,
          stepId: task.stepId,
          dueAt: task.dueAt,
          waitsOn: task.waitsOn,
        })),
        startsAt,
      )
    : null;
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  });
  const label = (at: Date) =>
    `${weekday.format(at)}, ${formatShortDate(at, tz, now)} · ${formatTime(at, tz, time.timeFormat)}`;
  const dated = planned.flatMap((task) => (task.dueAt ? [task.dueAt] : []));

  return (
    <Modal
      title={Text.title}
      description={Text.description}
      size="wide"
      onClose={onClose}
      footer={<Button onClick={onClose}>{Text.close}</Button>}
    >
      <div className={styles.preview}>
        <div className={styles.previewFields}>
          <TextField
            label={Text.date}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <TextField
            label={Text.time}
            type="time"
            value={clock}
            onChange={(event) => setClock(event.target.value)}
          />
        </div>
        {!startsAt || !flow ? (
          <p className={styles.text}>{Text.pickDate}</p>
        ) : planned.length === 0 ? (
          <p className={styles.text}>{Text.noTasks}</p>
        ) : (
          <>
            <p className={styles.text}>
              {dated.length > 0
                ? Text.summary(
                    planned.length,
                    label(dated[0]),
                    label(dated[dated.length - 1]),
                  )
                : Text.count(planned.length)}
            </p>
            {late.length > 0 ? (
              <Banner tone="alert" icon="time">
                {Text.late(late.map((task) => task.title))}
              </Banner>
            ) : null}
            <WorkloadWarningNotice
              warnings={warnings}
              note={Text.stillNote}
              groupName={(groupId) =>
                options.groups.find((group) => group.id === groupId)?.name ?? ""
              }
            />
            <FlowLegend
              showBad={false}
              extra={<span>· {Text.weekNote}</span>}
            />
            <FlowChart
              label={Text.flowLabel}
              columns={flow.columns.map((at) => (at ? label(at) : Text.noDue))}
              startsBefore={flow.startsBefore}
              links={flow.links}
              nodes={planned.map((task) => {
                const group = options.groups.find(
                  (entry) => entry.id === task.workGroupId,
                );
                const member = options.members.find(
                  (entry) => entry.id === task.memberId,
                );
                const week = weekBefore(task);
                const isLate =
                  task.dueAt !== null && task.dueAt.getTime() < now.getTime();
                return {
                  id: task.stepId,
                  column: flow.columnOf[task.stepId] ?? 0,
                  title: task.title,
                  meta: [
                    member
                      ? memberName(member)
                      : group
                        ? Text.anyoneIn(group.name)
                        : Text.nobody,
                    isLate ? Text.lateFromStart : null,
                  ].filter(Boolean),
                  badge: week ? <WeekPill state={week} /> : null,
                  problem: isLate,
                  // Starts locked: it waits for another task to be done.
                  waiting: task.waitsOn.some(
                    (wait) => wait.condition !== "order",
                  ),
                };
              })}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
