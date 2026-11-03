// File : /TeamSamsara.Workflow/app/src/features/tasks/hooks/useTasks.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Live task lists: the ones still to do that are given to me (and
// my work groups), the ones waiting for approval, and one task by id.

import { useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { usePermissions } from "@/core/access";
import {
  Collections,
  useLiveDocument,
  useLiveQueries,
  type DataErrorKind,
} from "@/core/data";
import { taskConverter, type TaskRecord } from "../types/taskTypes";

export interface TaskList {
  status: "loading" | "ready" | "error";
  items: TaskRecord[];
  error: DataErrorKind | null;
}

function toList(
  result: ReturnType<typeof useLiveQueries<TaskRecord>>,
): TaskList {
  if (result.status === "error") {
    return { status: "error", items: [], error: result.error };
  }
  if (result.status !== "ready")
    return { status: "loading", items: [], error: null };
  return { status: "ready", items: result.data ?? [], error: null };
}

/**
 * Tasks still to do (not finished or closed) given to this member, and, with
 * groups, to each of their work groups. One query each, as the rules require
 * for members who can't see everything.
 */
export function useOpenTasksFor(
  memberId: string | null,
  workGroupIds: readonly string[],
): TaskList {
  const isReady = usePermissions().status === "ready";
  const groups = [...workGroupIds].sort();
  const key =
    isReady && memberId ? `tasks:open:${memberId}:${groups.join(",")}` : null;
  const result = useLiveQueries(
    key,
    (database) => {
      const open = (field: string, value: string) =>
        query(
          collection(database, Collections.tasks),
          where(field, "==", value),
          where("doneAt", "==", null),
        ).withConverter(taskConverter);
      return [
        ...(memberId ? [open("memberId", memberId)] : []),
        ...groups.map((groupId) => open("workGroupId", groupId)),
      ];
    },
    (task) => task.id,
  );
  return useMemo(() => toList(result), [result]);
}

/** Tasks in any of these statuses (the ones waiting for approval). */
export function useTasksInStatuses(
  statusIds: readonly string[] | null,
): TaskList {
  const isReady = usePermissions().status === "ready";
  const ids = statusIds ? [...statusIds].sort() : null;
  const key = isReady && ids ? `tasks:statuses:${ids.join(",")}` : null;
  const result = useLiveQueries(
    key,
    (database) =>
      ids && ids.length > 0
        ? [
            query(
              collection(database, Collections.tasks),
              where("statusId", "in", ids.slice(0, 30)),
            ).withConverter(taskConverter),
          ]
        : [],
    (task) => task.id,
  );
  return useMemo(() => toList(result), [result]);
}

/** undefined while loading, null when there's no such task (or no access). */
export function useTask(taskId: string | undefined): {
  task: TaskRecord | null | undefined;
  error: DataErrorKind | null;
} {
  const isReady = usePermissions().status === "ready";
  const result = useLiveDocument(
    isReady && taskId ? `${Collections.tasks}/${taskId}` : null,
    taskConverter,
  );
  if (result.status === "error") return { task: null, error: result.error };
  if (result.status !== "ready") return { task: undefined, error: null };
  return { task: result.data ?? null, error: null };
}
