// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useEventSets.ts
// Version : 1.0.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : Sets of events, live: every set, one set by id, and the events of
// a set this member can see (asked the same way as the calendar, so the rules
// can check each query).

import { useMemo } from "react";
import { collection, orderBy, query, where } from "firebase/firestore";
import { usePermissions } from "@/core/access";
import {
  Collections,
  useLiveDocument,
  useLiveQueries,
  type DataErrorKind,
} from "@/core/data";
import type { CalendarScope, Viewer } from "../model/calendarScope";
import { eventConverter, type EventRecord } from "../types/eventTypes";
import { eventSetConverter, type EventSetRecord } from "../types/setTypes";
import { audienceKey, audienceQueries } from "./audienceQueries";

interface Live<T> {
  status: "loading" | "ready" | "error";
  items: T[];
  error: DataErrorKind | null;
}

/** Every set, newest first. */
export function useEventSets(): Live<EventSetRecord> {
  const isReady = usePermissions().status === "ready";
  const result = useLiveQueries(
    isReady ? "eventSets" : null,
    (database) => [
      query(
        collection(database, Collections.eventSets),
        orderBy("createdAt", "desc"),
      ).withConverter(eventSetConverter),
    ],
    (set) => set.id,
  );
  return useMemo(() => {
    if (result.status === "error")
      return { status: "error", items: [], error: result.error };
    if (result.status !== "ready")
      return { status: "loading", items: [], error: null };
    return {
      status: "ready",
      items: [...(result.data ?? [])].sort(
        (a, b) =>
          (b.createdAt?.getTime() ?? Infinity) -
          (a.createdAt?.getTime() ?? Infinity),
      ),
      error: null,
    };
  }, [result]);
}

/** undefined while loading, null when there's no such set. */
export function useEventSet(
  setId: string | null | undefined,
): EventSetRecord | null | undefined {
  const isReady = usePermissions().status === "ready";
  const result = useLiveDocument(
    isReady && setId ? `${Collections.eventSets}/${setId}` : null,
    eventSetConverter,
  );
  if (!setId) return null;
  if (result.status === "error") return null;
  if (result.status !== "ready") return undefined;
  return result.data ?? null;
}

/** The events of a set this member can see, earliest first. */
export function useSetEvents(
  setId: string | undefined,
  viewer: Viewer | null,
): Live<EventRecord> {
  const access = usePermissions();
  const scope: CalendarScope = access.can("viewAll")
    ? { kind: "all" }
    : { kind: "mine" };
  const key =
    access.status === "ready" && viewer && setId
      ? `setEvents:${setId}:${audienceKey(scope, viewer)}`
      : null;
  const result = useLiveQueries(
    key,
    (database) =>
      viewer && setId
        ? audienceQueries(
            collection(database, Collections.events).withConverter(
              eventConverter,
            ),
            scope,
            viewer,
            [where("setId", "==", setId)],
          )
        : [],
    (event) => event.id,
  );
  return useMemo(() => {
    if (result.status === "error")
      return { status: "error", items: [], error: result.error };
    if (result.status !== "ready")
      return { status: "loading", items: [], error: null };
    return {
      status: "ready",
      items: [...(result.data ?? [])].sort(
        (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
      ),
      error: null,
    };
  }, [result]);
}
