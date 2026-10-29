// File : /TeamSamsara.Workflow/app/src/core/data/useLiveCollection.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : The results of a query, kept current as documents are added, changed
// or removed. The key names the query: when it changes, the query is built again.

import { onSnapshot, type Firestore, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LiveResult } from "./liveTypes";
import { useLiveSubscription } from "./useLiveSubscription";

/**
 * @param queryKey A string that changes whenever the query should change, e.g.
 *   `tasks:assignee=${memberId}`, or null to wait.
 * @param buildQuery Builds the typed query (with its converter) from the database.
 */
export function useLiveCollection<TModel>(
  queryKey: string | null,
  buildQuery: (database: Firestore) => Query<TModel>,
): LiveResult<TModel[]> {
  return useLiveSubscription<TModel[]>(queryKey, (onData, onError) =>
    onSnapshot(
      buildQuery(db),
      (snapshot) => onData(snapshot.docs.map((document) => document.data())),
      onError,
    ),
  );
}
