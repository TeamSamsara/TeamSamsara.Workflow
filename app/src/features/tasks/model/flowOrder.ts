// File : /TeamSamsara.Workflow/app/src/features/tasks/model/flowOrder.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Puts tasks in the order of their workflow first and their due
// time second. An event's tasks stay together, in the order of its workflows
// and then of their steps; tasks added by hand come after them, by due time.
// Events (and tasks with no event) follow each other by their earliest due
// time. The order comes from the workflows as they are now, so reordering
// steps reorders the tasks they made.

export interface FlowTask {
  id: string;
  eventId: string | null;
  workflowId: string | null;
  stepId: string | null;
  dueAt: Date | null;
}

export interface FlowWorkflow {
  id: string;
  name: string;
  steps: readonly { id: string }[];
}

/** Where a task sits: its workflow's place, then its step's. */
export type FlowRank = (task: FlowTask) => readonly [number, number] | null;

/** After every workflow an event lists, in name order. */
const UnlistedWorkflow = 1000;

export function flowRank(
  workflows: readonly FlowWorkflow[],
  eventWorkflowIds: (eventId: string) => readonly string[] | undefined,
): FlowRank {
  const byName = [...workflows].sort((a, b) => a.name.localeCompare(b.name));
  const nameRank = new Map(
    byName.map((workflow, index) => [workflow.id, index]),
  );
  const steps = new Map(
    workflows.map((workflow) => [
      workflow.id,
      new Map(workflow.steps.map((step, index) => [step.id, index])),
    ]),
  );
  return (task) => {
    if (!task.workflowId || !task.stepId) return null;
    const step = steps.get(task.workflowId)?.get(task.stepId);
    if (step === undefined) return null;
    const listed = task.eventId ? eventWorkflowIds(task.eventId) : undefined;
    const at = listed?.indexOf(task.workflowId) ?? -1;
    const workflow =
      at >= 0
        ? at
        : UnlistedWorkflow +
          (nameRank.get(task.workflowId) ?? UnlistedWorkflow);
    return [workflow, step];
  };
}

const due = (task: FlowTask) => task.dueAt?.getTime() ?? Infinity;

function compareInEvent(a: FlowTask, b: FlowTask, rank: FlowRank): number {
  const left = rank(a);
  const right = rank(b);
  if (left && right)
    return left[0] - right[0] || left[1] - right[1] || due(a) - due(b);
  if (left) return -1;
  if (right) return 1;
  return due(a) - due(b);
}

export function sortByFlow<TTask extends FlowTask>(
  tasks: readonly TTask[],
  rank: FlowRank,
): TTask[] {
  const clusters = new Map<string, TTask[]>();
  for (const task of tasks) {
    const key = task.eventId ? `event:${task.eventId}` : `task:${task.id}`;
    const cluster = clusters.get(key);
    if (cluster) cluster.push(task);
    else clusters.set(key, [task]);
  }
  return [...clusters.entries()]
    .map(([key, cluster]) => ({
      key,
      first: Math.min(...cluster.map(due)),
      tasks: [...cluster].sort((a, b) => compareInEvent(a, b, rank)),
    }))
    .sort((a, b) => a.first - b.first || a.key.localeCompare(b.key))
    .flatMap((cluster) => cluster.tasks);
}

/** No workflows to go by: due time only, as before. */
export const noFlow: FlowRank = () => null;
