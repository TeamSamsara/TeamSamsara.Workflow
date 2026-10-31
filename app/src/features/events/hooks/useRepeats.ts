// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useRepeats.ts
// Version : 1.0.0
// Latest commit: feature/repeats
// Author : Gerrah
// Purpose : Every repeat, live; and keeping their events made a few weeks
// ahead. There's no server: the browser of a planner who opens the calendar
// does it, once per repeat per visit.

import { useEffect, useMemo } from "react";
import { collection } from "firebase/firestore";
import { usePermissions } from "@/core/access";
import { Collections, useLiveCollection } from "@/core/data";
import type { WorkflowRecord } from "@/features/workflows";
import type { Formats } from "../model/applyWorkflows";
import { topUpRepeat } from "../service/repeatService";
import { repeatConverter, type RepeatRecord } from "../types/repeatTypes";

export function useRepeats(): RepeatRecord[] {
  const isReady = usePermissions().status === "ready";
  const result = useLiveCollection(isReady ? "repeats:all" : null, (database) =>
    collection(database, Collections.repeats).withConverter(repeatConverter),
  );
  return useMemo(() => result.data ?? [], [result]);
}

/** Repeats topped up during this visit, so each is done once. */
const toppedUp = new Set<string>();

interface TopUpContext {
  repeats: readonly RepeatRecord[];
  workflows: readonly WorkflowRecord[];
  /** False until the workflows have loaded. */
  workflowsReady: boolean;
  formats: Formats;
  startingStatusId: string | null;
  memberId: string | null;
  today: string;
}

export function useRepeatTopUp({
  repeats,
  workflows,
  workflowsReady,
  formats,
  startingStatusId,
  memberId,
  today,
}: TopUpContext): void {
  const canPlan = usePermissions().can("planEvents");

  useEffect(() => {
    if (!canPlan || !workflowsReady || !startingStatusId || !memberId) return;
    for (const repeat of repeats) {
      const key = `${repeat.id}:${repeat.updatedAt?.getTime() ?? 0}:${today}`;
      if (toppedUp.has(key)) continue;
      toppedUp.add(key);
      topUpRepeat(repeat, {
        workflows,
        formats,
        startingStatusId,
        createdBy: memberId,
        today,
      }).catch(() => {
        // Another planner may have made them at the same moment; try next visit.
        toppedUp.delete(key);
      });
    }
  }, [
    canPlan,
    workflowsReady,
    repeats,
    workflows,
    formats,
    startingStatusId,
    memberId,
    today,
  ]);
}
