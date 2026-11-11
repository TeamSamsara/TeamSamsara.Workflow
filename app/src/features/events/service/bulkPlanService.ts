// File : /TeamSamsara.Workflow/app/src/features/events/service/bulkPlanService.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Records that a set or repeat was planned, once all its events and
// tasks are saved, so the server sends each person one summary instead of a
// notification per task. A record that fails to save only means no summary:
// the events are already made, so it never fails the planning.

import { collection, doc, setDoc } from "firebase/firestore";
import { Collections, serverTime } from "@/core/data";
import { db } from "@/lib/firebase";

/** Firestore keeps lists short; a bigger plan sums up its first 500 events. */
const maxEvents = 500;

export interface BulkPlan {
  kind: "set" | "repeat";
  /** The set's or repeat's id. */
  sourceId: string;
  name: string;
  eventIds: readonly string[];
  byId: string;
}

export async function recordBulkPlan(plan: BulkPlan): Promise<void> {
  if (plan.eventIds.length === 0) return;
  try {
    await setDoc(doc(collection(db, Collections.bulkPlans)), {
      kind: plan.kind,
      sourceId: plan.sourceId,
      name: plan.name.trim().slice(0, 120) || "Events",
      eventIds: plan.eventIds.slice(0, maxEvents),
      byId: plan.byId,
      at: serverTime(),
    });
  } catch (error) {
    console.warn("The planning summary wasn't recorded", error);
  }
}
