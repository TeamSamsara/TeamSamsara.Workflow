// File : /TeamSamsara.Workflow/app/src/features/availability/hooks/useAvailability.ts
// Version : 1.2.0
// Latest commit: fix/private-appointments
// Author : Gerrah
// Purpose : Live availability, appointments and busy times: one member's
// usual week, everyone's, personal appointments in some dates (a member's own,
// plus those shared with them as a group lead), and everyone's busy times.

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
 * The personal appointments starting in these dates that this member may see
 * what they are: their own, and the ones teammates shared with them as one of
 * their group leads. Everyone else's show only as busy times.
 */
export function usePersonalInRange(
  memberId: string | null,
  start: Date,
  end: Date,
  { shared = false }: { shared?: boolean } = {},
): PersonalEntry[] {
  const isReady = usePermissions().status === "ready";
  const key =
    isReady && memberId
      ? `personal:${memberId}:${shared ? "shared" : "own"}:${start.getTime()}-${end.getTime()}`
      : null;
  const result = useLiveQueries(
    key,
    (database) => {
      if (!memberId) return [];
      const inDates = [
        where("startsAt", ">=", new Date(start.getTime() - lookBack)),
        where("startsAt", "<", end),
        orderBy("startsAt"),
      ];
      const personal = collection(database, Collections.personal);
      return [
        query(personal, where("memberId", "==", memberId), ...inDates),
        ...(shared
          ? [
              query(
                personal,
                where("visibleTo", "array-contains", memberId),
                ...inDates,
              ),
            ]
          : []),
      ].map((entries) => entries.withConverter(personalConverter));
    },
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
