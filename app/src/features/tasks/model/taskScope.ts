// File : /TeamSamsara.Workflow/app/src/features/tasks/model/taskScope.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Whose tasks My tasks shows: Mine (given to me by name), My groups
// (mine and every task of my work groups) or Pick groups (mine and the groups
// I tick). Also which groups to ask the database for.

export const TaskScopes = ["mine", "groups", "pick"] as const;
export type TaskScope = (typeof TaskScopes)[number];

interface Assigned {
  memberId: string | null;
  workGroupId: string | null;
}

/** The groups whose tasks this scope needs. */
export function scopeGroupIds(
  scope: TaskScope,
  myGroupIds: readonly string[],
  pickedIds: readonly string[],
): string[] {
  if (scope === "mine") return [];
  if (scope === "groups") return [...myGroupIds];
  return [...pickedIds];
}

/** Whether a task belongs in the scope. */
export function inScope(
  task: Assigned,
  scope: TaskScope,
  me: string,
  myGroupIds: readonly string[],
  pickedIds: readonly string[],
): boolean {
  if (task.memberId === me) return true;
  if (scope === "mine" || !task.workGroupId) return false;
  return scopeGroupIds(scope, myGroupIds, pickedIds).includes(task.workGroupId);
}

/** A remembered scope, or Mine. */
export function readScope(value: string | null): TaskScope {
  return (TaskScopes as readonly string[]).includes(value ?? "")
    ? (value as TaskScope)
    : "mine";
}
