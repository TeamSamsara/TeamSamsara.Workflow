// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useEventLabels.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The title and start of the events a list of tasks belongs to, so
// each task can link to its event. Read once each (an event someone can't see
// is left out, and its task just has no link).

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { useMemo } from "react";
import { Collections } from "@/core/data";
import { db } from "@/lib/firebase";
import { eventConverter } from "../types/eventTypes";

export interface EventLabel {
  title: string;
  startsAt: Date;
}

async function readLabel(id: string): Promise<EventLabel | null> {
  try {
    const found = await getDoc(
      doc(db, Collections.events, id).withConverter(eventConverter),
    );
    const event = found.data();
    return event ? { title: event.title, startsAt: event.startsAt } : null;
  } catch {
    return null;
  }
}

export function useEventLabels(
  eventIds: readonly (string | null)[],
): ReadonlyMap<string, EventLabel> {
  const ids = useMemo(
    () =>
      [...new Set(eventIds.filter((id): id is string => id !== null))].sort(),
    [eventIds],
  );
  const result = useQuery({
    queryKey: ["eventLabels", ids.join(",")],
    queryFn: async () => {
      const labels = await Promise.all(ids.map(readLabel));
      return new Map(
        ids.flatMap((id, index) => {
          const label = labels[index];
          return label ? [[id, label] as const] : [];
        }),
      );
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
  return result.data ?? new Map();
}
