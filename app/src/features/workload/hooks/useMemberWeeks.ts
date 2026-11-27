// File : /TeamSamsara.Workflow/app/src/features/workload/hooks/useMemberWeeks.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload-b
// Author : Gerrah
// Purpose : Other people's weeks, as the server keeps them (memberWeeks): one
// word per week, so Reassign, claiming and a group's page can say who has
// room without reading anyone's tasks.

import { documentId, collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import type { WeekState } from "@engine/workload";
import { usePermissions } from "@/core/access";
import { Collections, createConverter, useLiveQueries } from "@/core/data";

export interface MemberWeeksRecord {
  id: string;
  /** By the first day of each week ("2026-11-16") that has dated tasks. */
  states: Record<string, WeekState>;
  /** A week with none of their dated tasks. */
  empty: WeekState;
}

const states = ["available", "limited", "atCapacity", "over"] as const;
const isState = (value: unknown): value is WeekState =>
  states.includes(value as WeekState);

const converter = createConverter<MemberWeeksRecord>({
  parse: (id, data) => ({
    id,
    states: Object.fromEntries(
      Object.entries((data.states ?? {}) as Record<string, unknown>).filter(
        (entry): entry is [string, WeekState] => isState(entry[1]),
      ),
    ),
    empty: isState(data.empty) ? data.empty : "available",
  }),
  serialize: () => ({}),
});

/** These people's weeks, by id; someone with none yet is left out. */
export function useMemberWeeks(
  memberIds: readonly string[],
): ReadonlyMap<string, MemberWeeksRecord> {
  const isReady = usePermissions().status === "ready";
  const ids = [...new Set(memberIds)].sort();
  const key = isReady && ids.length ? `memberWeeks:${ids.join(",")}` : null;
  const result = useLiveQueries(
    key,
    (database) =>
      Array.from({ length: Math.ceil(ids.length / 30) }, (_, index) =>
        query(
          collection(database, Collections.memberWeeks),
          where(documentId(), "in", ids.slice(index * 30, index * 30 + 30)),
        ).withConverter(converter),
      ),
    (record) => record.id,
  );
  return useMemo(
    () => new Map((result.data ?? []).map((record) => [record.id, record])),
    [result.data],
  );
}
