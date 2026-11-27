// File : /TeamSamsara.Workflow/app/src/features/workload/hooks/useGroupWeeks.ts
// Version : 1.0.0
// Latest commit: feature/1.2-workload-c
// Author : Gerrah
// Purpose : Groups' weeks, as the server keeps them (groupWeeks): how much of
// each week their open tasks take, and their usual week, for the planning
// warnings and a group's coming weeks.

import { collection, documentId, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { usePermissions } from "@/core/access";
import { Collections, createConverter, useLiveQueries } from "@/core/data";

export interface GroupWeeksRecord {
  id: string;
  /** By the first day of each week ("2026-11-16") that has dated tasks. */
  loads: Record<string, number>;
  /** What a week with no dated tasks takes. */
  base: number;
  /** Null when the group has no usual week (no warnings). */
  usualWeek: number | null;
}

const converter = createConverter<GroupWeeksRecord>({
  parse: (id, data) => ({
    id,
    loads: Object.fromEntries(
      Object.entries((data.loads ?? {}) as Record<string, unknown>).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      ),
    ),
    base: typeof data.base === "number" ? data.base : 0,
    usualWeek: typeof data.usualWeek === "number" ? data.usualWeek : null,
  }),
  serialize: () => ({}),
});

/** These groups' weeks, by id; a group with none yet is left out. */
export function useGroupWeeks(
  groupIds: readonly string[],
): ReadonlyMap<string, GroupWeeksRecord> {
  const isReady = usePermissions().status === "ready";
  const ids = [...new Set(groupIds)].sort();
  const key = isReady && ids.length ? `groupWeeks:${ids.join(",")}` : null;
  const result = useLiveQueries(
    key,
    (database) =>
      Array.from({ length: Math.ceil(ids.length / 30) }, (_, index) =>
        query(
          collection(database, Collections.groupWeeks),
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
