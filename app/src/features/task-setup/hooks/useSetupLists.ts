// File : /TeamSamsara.Workflow/app/src/features/task-setup/hooks/useSetupLists.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : The workspace's statuses, event types and tags, live and in their
// order. Every signed-in member reads them (tasks and the calendar use them).

import { useMemo } from "react";
import {
  collection,
  type DocumentData,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { usePermissions } from "@/core/access";
import {
  byPosition,
  colouredItemConverter,
  Collections,
  statusConverter,
  useLiveCollection,
  type ColouredItem,
  type DataErrorKind,
  type StatusRecord,
} from "@/core/data";

export interface SetupList<TItem> {
  status: "loading" | "ready" | "error";
  items: TItem[];
  error: DataErrorKind | null;
}

function useOrdered<TItem extends { position: number; name: string }>(
  key: string,
  list: string,
  converter: FirestoreDataConverter<TItem, DocumentData>,
): SetupList<TItem> {
  const isReady = usePermissions().status === "ready";
  const result = useLiveCollection(isReady ? key : null, (database) =>
    collection(database, list).withConverter(converter),
  );
  return useMemo<SetupList<TItem>>(() => {
    if (result.status === "error") {
      return { status: "error", items: [], error: result.error };
    }
    if (result.status !== "ready") {
      return { status: "loading", items: [], error: null };
    }
    return {
      status: "ready",
      items: byPosition(result.data ?? []),
      error: null,
    };
  }, [result]);
}

export function useStatuses(): SetupList<StatusRecord> {
  return useOrdered<StatusRecord>(
    "setup:statuses",
    Collections.statuses,
    statusConverter,
  );
}

export function useEventTypes(): SetupList<ColouredItem> {
  return useOrdered<ColouredItem>(
    "setup:eventTypes",
    Collections.eventTypes,
    colouredItemConverter,
  );
}

export function useTags(): SetupList<ColouredItem> {
  return useOrdered<ColouredItem>(
    "setup:tags",
    Collections.tags,
    colouredItemConverter,
  );
}
