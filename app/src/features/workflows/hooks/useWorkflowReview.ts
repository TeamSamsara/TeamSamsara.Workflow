// File : /TeamSamsara.Workflow/app/src/features/workflows/hooks/useWorkflowReview.ts
// Version : 1.0.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : After you save a workflow: the open tasks whose due time now
// differs from their step, as the server writes them down for you
// (workflowReviews), with which you've asked to move and which it moved.
// Only the list from this save counts; null until there is one.

import type { DocumentData } from "firebase/firestore";
import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import {
  Collections,
  createConverter,
  readBoolean,
  readDate,
  readNumber,
  readString,
  readStringList,
  useLiveQueries,
} from "@/core/data";

export interface ReviewTask {
  taskId: string;
  title: string;
  eventTitle: string;
  from: Date | null;
  to: Date | null;
  /** Its due time was changed by hand. */
  edited: boolean;
}

export interface WorkflowReview {
  id: string;
  workflowId: string;
  tasks: ReviewTask[];
  /** How many differ, written down or not. */
  total: number;
  /** Asked to move; moved; couldn't be moved (changed since). */
  move: string[];
  moved: string[];
  skipped: string[];
  left: boolean;
  at: Date | null;
}

const readTasks = (data: DocumentData): ReviewTask[] =>
  Array.isArray(data.tasks)
    ? (data.tasks as DocumentData[]).flatMap((entry) =>
        typeof entry?.taskId === "string"
          ? [
              {
                taskId: entry.taskId,
                title: readString(entry, "title"),
                eventTitle: readString(entry, "eventTitle"),
                from: readDate(entry, "from"),
                to: readDate(entry, "to"),
                edited: readBoolean(entry, "edited"),
              },
            ]
          : [],
      )
    : [];

const converter = createConverter<WorkflowReview>({
  parse: (id, data) => ({
    id,
    workflowId: readString(data, "workflowId"),
    tasks: readTasks(data),
    total: readNumber(data, "total"),
    move: readStringList(data, "move"),
    moved: readStringList(data, "moved"),
    skipped: readStringList(data, "skipped"),
    left: readBoolean(data, "left"),
    at: readDate(data, "at"),
  }),
  serialize: () => ({}),
});

/** Allowance for the server's clock running behind this device's. */
const ClockSlackMs = 2 * 60 * 1000;

/** The list from the save made at `savedAt`, by me; null until it's written. */
export function useWorkflowReview(
  workflowId: string | null,
  memberId: string | null,
  savedAt: Date | null,
): WorkflowReview | null {
  const key =
    workflowId && memberId && savedAt
      ? `workflowReviews:${workflowId}:${memberId}:${savedAt.getTime()}`
      : null;
  const result = useLiveQueries(
    key,
    (database) => [
      query(
        collection(database, Collections.workflowReviews),
        where("byId", "==", memberId),
        where("workflowId", "==", workflowId),
      ).withConverter(converter),
    ],
    (record) => record.id,
  );
  return useMemo(() => {
    if (!savedAt) return null;
    const since = savedAt.getTime() - ClockSlackMs;
    return (
      (result.data ?? [])
        .filter((review) => review.at && review.at.getTime() >= since)
        .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0))[0] ??
      null
    );
  }, [result.data, savedAt]);
}
