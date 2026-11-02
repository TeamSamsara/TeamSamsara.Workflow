// File : /TeamSamsara.Workflow/app/src/features/availability/hooks/useAvailability.ts
// Version : 1.1.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : Live availability, appointments and busy times: one member's
// usual week, everyone's, personal appointments in some dates (a member's own,
// or everyone's for managers), and everyone's busy times in some dates.

import { useMemo } from "react";
import { collection, orderBy, query, where } from "firebase/firestore";
import { usePermissions } from "@/core/access";
import { useWorkspaceRecord } from "@/core/workspace";
import {
  Collections,
  useLiveCollection,
  useLiveDocument,
  useLiveQueries,
} from "@/core/data";
import {
  availabilityConverter,
  busyConverter,
  personalConverter,
  type AvailabilityRecord,
  type BusyEntry,
  type PersonalEntry,
} from "../types/availabilityTypes";

/** Appointments can start the day before and still reach into the dates shown. */
const lookBack = 24 * 60 * 60_000;

/** undefined while loading, null when the member hasn't set it yet. */
export function useAvailability(
  memberId: string | null,
): AvailabilityRecord | null | undefined {
  const isReady = usePermissions().status === "ready";
  const workspaceZone = useWorkspaceRecord().timeZone;
  const result = useLiveDocument(
    isReady && memberId ? `${Collections.availability}/${memberId}` : null,
    availabilityConverter,
  );
  if (result.status === "error") return null;
  if (result.status !== "ready") return undefined;
  return result.data
    ? { ...result.data, timeZone: result.data.timeZone ?? workspaceZone }
    : null;
}

/** Everyone's usual week, by member id. */
export function useAllAvailability(): Map<string, AvailabilityRecord> {
  const isReady = usePermissions().status === "ready";
  const workspaceZone = useWorkspaceRecord().timeZone;
  const result = useLiveCollection(
    isReady ? "availability:all" : null,
    (database) =>
      collection(database, Collections.availability).withConverter(
        availabilityConverter,
      ),
  );
  return useMemo(
    () =>
      new Map(
        (result.data ?? []).map((record) => [
          record.memberId,
          { ...record, timeZone: record.timeZone ?? workspaceZone },
        ]),
      ),
    [result, workspaceZone],
  );
}

/**
 * Personal appointments starting in these dates: one member's (their own), or
 * everyone's when memberId is "all" (for See everyone's availability).
 */
export function usePersonalInRange(
  memberId: string | "all" | null,
  start: Date,
  end: Date,
): PersonalEntry[] {
  const access = usePermissions();
  const allowed = memberId !== "all" || access.can("viewAvailability");
  const key =
    access.status === "ready" && memberId && allowed
      ? `personal:${memberId}:${start.getTime()}-${end.getTime()}`
      : null;
  const result = useLiveQueries(
    key,
    (database) => [
      query(
        collection(database, Collections.personal),
        ...(memberId && memberId !== "all"
          ? [where("memberId", "==", memberId)]
          : []),
        where("startsAt", ">=", new Date(start.getTime() - lookBack)),
        where("startsAt", "<", end),
        orderBy("startsAt"),
      ).withConverter(personalConverter),
    ],
    (entry) => entry.id,
  );
  return useMemo(
    () => (result.data ?? []).filter((entry) => entry.endsAt > start),
    [result, start],
  );
}

/** Everyone's busy times starting in these dates. */
export function useBusyInRange(
  start: Date,
  end: Date,
  enabled = true,
): BusyEntry[] {
  const isReady = usePermissions().status === "ready";
  const key =
    isReady && enabled ? `busy:${start.getTime()}-${end.getTime()}` : null;
  const result = useLiveQueries(
    key,
    (database) => [
      query(
        collection(database, Collections.busy),
        where("startsAt", ">=", new Date(start.getTime() - lookBack)),
        where("startsAt", "<", end),
        orderBy("startsAt"),
      ).withConverter(busyConverter),
    ],
    (entry) => entry.id,
  );
  return useMemo(
    () => (result.data ?? []).filter((entry) => entry.endsAt > start),
    [result, start],
  );
}
