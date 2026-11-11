// File : /TeamSamsara.Workflow/app/src/views/groups/useGroupOverview.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : What a group's pages show, live: its open tasks (given to the
// group, and, for people who see every task, to its members by name) and its
// events in the next few weeks. Only asked for when the viewer may read them
// (they're in the group, or they see everything), so nothing fails.

import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { usePermissions } from "@/core/access";
import { Collections, splitIntoChunks, useLiveQueries } from "@/core/data";
import { useSession } from "@/core/session";
import {
  useEventsInRange,
  useSeesAllEvents,
  useSeesAllTasks,
  type EventRecord,
} from "@/features/events";
import { taskConverter, type TaskRecord } from "@/features/tasks";

const ahead = 28 * 24 * 60 * 60 * 1000;

export interface GroupOverview {
  /** Null when the viewer can't see this group's tasks. */
  tasks: TaskRecord[] | null;
  /** Null when the viewer can't see this group's events. */
  events: EventRecord[] | null;
}

export function useGroupOverview(
  groupId: string,
  memberIds: readonly string[],
  now: Date,
): GroupOverview {
  const isReady = usePermissions().status === "ready";
  const session = useSession();
  const viewer = session.status === "active" ? session.member : null;
  const seesAllTasks = useSeesAllTasks();
  const seesAllEvents = useSeesAllEvents();
  const isIn = viewer?.workGroupIds.includes(groupId) ?? false;
  const canTasks = isIn || seesAllTasks;
  const canEvents = isIn || seesAllEvents;
  const people = [...memberIds].sort();

  const result = useLiveQueries(
    isReady && canTasks
      ? `groupTasks:${groupId}:${seesAllTasks ? people.join(",") : ""}`
      : null,
    (database) => {
      const tasks = collection(database, Collections.tasks);
      const open = (...filters: ReturnType<typeof where>[]) =>
        query(tasks, ...filters, where("doneAt", "==", null)).withConverter(
          taskConverter,
        );
      return [
        open(where("workGroupId", "==", groupId)),
        ...(seesAllTasks
          ? splitIntoChunks(people, 30).map((chunk) =>
              open(where("memberId", "in", chunk)),
            )
          : []),
      ];
    },
    (task) => task.id,
  );

  // The hour's start, so the query stays the same for the hour.
  const hourKey = Math.floor(now.getTime() / 3_600_000);
  const from = useMemo(() => new Date(hourKey * 3_600_000), [hourKey]);
  const to = useMemo(() => new Date(from.getTime() + ahead), [from]);
  const events = useEventsInRange(
    from,
    to,
    { kind: "group", groupId },
    canEvents && viewer
      ? { id: viewer.id, workGroupIds: viewer.workGroupIds }
      : null,
  );

  return useMemo(
    () => ({
      tasks:
        !canTasks || result.status === "error"
          ? null
          : [...(result.data ?? [])].sort(
              (a, b) =>
                (a.dueAt?.getTime() ?? Infinity) -
                (b.dueAt?.getTime() ?? Infinity),
            ),
      events: canEvents && events.status !== "error" ? events.items : null,
    }),
    [canTasks, canEvents, result, events],
  );
}
