// File : /TeamSamsara.Workflow/app/src/features/maintenance/hooks/useMaintenance.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The check-up's live state for Administrators: whether Apply is on
// and the latest reports.

import { collection, limit, orderBy, query } from "firebase/firestore";
import { useMemo } from "react";
import {
  Collections,
  createConverter,
  readDate,
  readNumber,
  readOptionalString,
  readString,
  useLiveCollection,
  useLiveDocument,
} from "@/core/data";

export interface MaintenanceRun {
  id: string;
  at: Date | null;
  trigger: string;
  mode: "report" | "apply";
  byId: string | null;
  total: number;
  counts: Record<string, number>;
  examples: Record<string, string[]>;
  files: { count: number; examples: string[] };
}

const runConverter = createConverter<MaintenanceRun>({
  parse: (id, data) => {
    const counts: Record<string, number> = {};
    for (const [key, value] of Object.entries(data.counts ?? {}))
      if (typeof value === "number") counts[key] = value;
    const examples: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(data.examples ?? {}))
      if (Array.isArray(value))
        examples[key] = value.filter(
          (entry): entry is string => typeof entry === "string",
        );
    const files = (data.files ?? {}) as Record<string, unknown>;
    return {
      id,
      at: readDate(data, "at"),
      trigger: readString(data, "trigger"),
      mode: data.mode === "apply" ? "apply" : "report",
      byId: readOptionalString(data, "byId"),
      total: readNumber(data, "total"),
      counts,
      examples,
      files: {
        count: typeof files.count === "number" ? files.count : 0,
        examples: Array.isArray(files.examples)
          ? files.examples.filter(
              (entry): entry is string => typeof entry === "string",
            )
          : [],
      },
    };
  },
  serialize: () => ({}),
});

const switchConverter = createConverter<{ id: string; apply: boolean }>({
  parse: (id, data) => ({ id, apply: data.apply === true }),
  serialize: ({ apply }) => ({ apply }),
});

export function useMaintenance(enabled: boolean) {
  const runs = useLiveCollection(
    enabled ? "maintenanceRuns" : null,
    (database) =>
      query(
        collection(database, "maintenanceRuns"),
        orderBy("at", "desc"),
        limit(5),
      ).withConverter(runConverter),
  );
  const toggle = useLiveDocument(
    enabled ? `${Collections.config}/maintenance` : null,
    switchConverter,
  );
  return useMemo(
    () => ({
      runs: runs.status === "ready" ? (runs.data ?? []) : [],
      apply: toggle.status === "ready" ? (toggle.data?.apply ?? false) : false,
      isLoading: runs.status === "loading" || toggle.status === "loading",
    }),
    [runs, toggle],
  );
}
