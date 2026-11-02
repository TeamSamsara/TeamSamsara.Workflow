// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useEvents.ts
// Version : 1.2.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Live events for the dates on screen, one event by id, an event's
// tasks, how far each shown event's tasks are, and the one-off tasks due in
// the shown dates. Each member reads only the events they may see, and only
// their own tasks unless they can see every task.

import { useMemo } from "react";
import { collection, orderBy, query, where } from "firebase/firestore";
import { usePermissions } from "@/core/access";
import {
  Collections,
  splitIntoChunks,
  useLiveDocument,
  useLiveQueries,
  type DataErrorKind,
  type MemberRecord,
} from "@/core/data";
import { taskConverter, type TaskRecord } from "@/features/tasks";
import type { CalendarScope, Viewer } from "../model/calendarScope";
import { eventConverter, type EventRecord } from "../types/eventTypes";
import { audienceKey, audienceQueries } from "./audienceQueries";

interface Live<T> {
  status: "loading" | "ready" | "error";
  items: T[];
  error: DataErrorKind | null;
}

function toLive<T>(result: {
  status: string;
  data: T[] | undefined;
  error: DataErrorKind | null;
}): Live<T> {
  if (result.status === "error")
    return { status: "error", items: [], error: result.error };
  if (result.status !== "ready")
    return { status: "loading", items: [], error: null };
  return { status: "ready", items: result.data ?? [], error: null };
}

/** Whether this member may read every task (so lists can ask for all of them). */
export function useSeesAllTasks(): boolean {
  const access = usePermissions();
  return (
    access.can("viewAll") ||
    access.can("approveTasks") ||
    access.can("editAnyTask")
  );
}

/** Whether this member sees every event (View all). */
export function useSeesAllEvents(): boolean {
  return usePermissions().can("viewAll");
}

/** The events of one calendar (see CalendarScope) starting in these dates. */
export function useEventsInRange(
  start: Date,
  end: Date,
  scope: CalendarScope,
  viewer: Viewer | null,
): Live<EventRecord> {
  const isReady = usePermissions().status === "ready";
  const key =
    isReady && viewer
      ? `events:${start.getTime()}-${end.getTime()}:${audienceKey(scope, viewer)}`
      : null;
  const result = useLiveQueries(
    key,
    (database) =>
      viewer
        ? audienceQueries(
            collection(database, Collections.events).withConverter(
              eventConverter,
            ),
            scope,
            viewer,
            [
              where("startsAt", ">=", start),
              where("startsAt", "<", end),
              orderBy("startsAt"),
            ],
          )
        : [],
    (event) => event.id,
  );
  return useMemo(() => {
    const live = toLive(result);
    return {
      ...live,
      items: [...live.items].sort(
        (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
      ),
    };
  }, [result]);
}

/** undefined while loading, null when there's no such event. */
export function useEvent(
  eventId: string | undefined,
): EventRecord | null | undefined {
  const isReady = usePermissions().status === "ready";
  const result = useLiveDocument(
    isReady && eventId ? `${Collections.events}/${eventId}` : null,
    eventConverter,
  );
  if (result.status === "error") return null;
  if (result.status !== "ready") return undefined;
  return result.data ?? null;
}

/** The event's tasks: all of them, or for others only theirs and their groups'. */
/**
 * Whether this member may read every event's tasks: those who see every task,
 * and planners (who move, skip and delete events with their tasks).
 */
export function useSeesEventTasks(): boolean {
  const seesAll = useSeesAllTasks();
  const canPlan = usePermissions().can("planEvents");
  return seesAll || canPlan;
}

export function useEventTasks(
  eventId: string | undefined,
  viewer: Pick<MemberRecord, "id" | "workGroupIds"> | null,
): Live<TaskRecord> {
  const isReady = usePermissions().status === "ready";
  const seesAll = useSeesEventTasks();
  const groups = [...(viewer?.workGroupIds ?? [])].sort();
  const key =
    isReady && eventId && viewer
      ? `eventTasks:${eventId}:${seesAll ? "all" : `${viewer.id}:${groups.join(",")}`}`
      : null;
  const result = useLiveQueries(
    key,
    (database) => {
      const tasks = collection(database, Collections.tasks);
      const forEvent = (...filters: ReturnType<typeof where>[]) =>
        query(tasks, where("eventId", "==", eventId), ...filters).withConverter(
          taskConverter,
        );
      if (seesAll) return [forEvent()];
      return [
        forEvent(where("memberId", "==", viewer?.id ?? "")),
        ...groups.map((group) => forEvent(where("workGroupId", "==", group))),
      ];
    },
    (task) => task.id,
  );
  return useMemo(() => {
    const live = toLive(result);
    return {
      ...live,
      items: [...live.items].sort(
        (a, b) =>
          (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity),
      ),
    };
  }, [result]);
}

export interface Progress {
  done: number;
  total: number;
  /** The work groups its tasks are given to. */
  groupIds: Set<string>;
}

/** How many of each event's tasks are done (for members who see every event's tasks). */
export function useEventProgress(
  eventIds: readonly string[],
): Map<string, Progress> {
  const isReady = usePermissions().status === "ready";
  const seesAll = useSeesEventTasks();
  const ids = [...eventIds].sort();
  const key =
    isReady && seesAll && ids.length > 0
      ? `eventProgress:${ids.join(",")}`
      : null;
  const result = useLiveQueries(
    key,
    (database) =>
      splitIntoChunks(ids, 30).map((chunk) =>
        query(
          collection(database, Collections.tasks),
          where("eventId", "in", chunk),
        ).withConverter(taskConverter),
      ),
    (task) => task.id,
  );
  return useMemo(() => {
    const progress = new Map<string, Progress>();
    for (const task of result.data ?? []) {
      if (!task.eventId) continue;
      const entry = progress.get(task.eventId) ?? {
        done: 0,
        total: 0,
        groupIds: new Set(),
      };
      entry.total += 1;
      if (task.doneAt) entry.done += 1;
      if (task.workGroupId) entry.groupIds.add(task.workGroupId);
      progress.set(task.eventId, entry);
    }
    return progress;
  }, [result]);
}

/** One-off tasks due in the shown dates (for members who see every task). */
export function useStandaloneTasksInRange(
  start: Date,
  end: Date,
): Live<TaskRecord> {
  const isReady = usePermissions().status === "ready";
  const seesAll = useSeesAllTasks();
  const key =
    isReady && seesAll
      ? `standalone:${start.getTime()}-${end.getTime()}`
      : null;
  const result = useLiveQueries(
    key,
    (database) => [
      query(
        collection(database, Collections.tasks),
        where("eventId", "==", null),
        where("dueAt", ">=", start),
        where("dueAt", "<", end),
        orderBy("dueAt"),
      ).withConverter(taskConverter),
    ],
    (task) => task.id,
  );
  return useMemo(() => toLive(result), [result]);
}
