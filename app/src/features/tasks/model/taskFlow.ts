// File : /TeamSamsara.Workflow/app/src/features/tasks/model/taskFlow.ts
// Version : 1.0.0
// Latest commit: feature/1.2-flow-view
// Author : Gerrah
// Purpose : An event's tasks as a flow: one column per due time, in time
// order (tasks with no due time last), where the event starts among them,
// and a link from each task to the ones that come after it, from the steps
// their workflow says they wait on. Solid when something has to happen
// first, dashed when it's only the order.

export interface TaskFlowTask {
  id: string;
  workflowId: string | null;
  stepId: string | null;
  dueAt: Date | null;
  waitsOn: readonly { stepId: string; condition: string }[];
}

export interface TaskFlowLink {
  id: string;
  from: string;
  to: string;
  kind: "hard" | "soft";
}

export interface TaskFlow {
  /** Due times, earliest first; null for "no due time", always last. */
  columns: (Date | null)[];
  /** The event starts before this column; null when every task is before it. */
  startsBefore: number | null;
  columnOf: Record<string, number>;
  links: TaskFlowLink[];
}

export function taskFlow(
  tasks: readonly TaskFlowTask[],
  startsAt: Date,
): TaskFlow {
  const times = [
    ...new Set(
      tasks.flatMap((task) => (task.dueAt ? [task.dueAt.getTime()] : [])),
    ),
  ].sort((a, b) => a - b);
  const columns: (Date | null)[] = times.map((time) => new Date(time));
  if (tasks.some((task) => !task.dueAt)) columns.push(null);
  const columnOf: Record<string, number> = {};
  for (const task of tasks) {
    columnOf[task.id] = task.dueAt
      ? times.indexOf(task.dueAt.getTime())
      : columns.length - 1;
  }
  const firstAfter = times.findIndex((time) => time >= startsAt.getTime());
  const links: TaskFlowLink[] = [];
  for (const task of tasks) {
    if (!task.workflowId) continue;
    for (const wait of task.waitsOn) {
      const before = tasks.find(
        (other) =>
          other.id !== task.id &&
          other.workflowId === task.workflowId &&
          other.stepId === wait.stepId,
      );
      if (!before) continue;
      links.push({
        id: `${before.id}>${task.id}`,
        from: before.id,
        to: task.id,
        kind: wait.condition === "order" ? "soft" : "hard",
      });
    }
  }
  return {
    columns,
    startsBefore: firstAfter === -1 ? null : firstAfter,
    columnOf,
    links,
  };
}
