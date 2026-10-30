// File : /TeamSamsara.Workflow/app/src/core/data/useLiveQueries.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : The results of several queries as one live list, each document
// once. For lists the security rules only allow piece by piece, e.g. "tasks
// given to me" plus "tasks given to each of my groups".

import { onSnapshot, type Firestore, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LiveResult } from "./liveTypes";
import { useLiveSubscription } from "./useLiveSubscription";

/**
 * @param queryKey Changes whenever the queries should change, or null to wait.
 * @param buildQueries The typed queries (with converters); results are merged by id.
 * @param idOf A document's id, to show it once when two queries both find it.
 */
export function useLiveQueries<TModel>(
  queryKey: string | null,
  buildQueries: (database: Firestore) => Query<TModel>[],
  idOf: (model: TModel) => string,
): LiveResult<TModel[]> {
  return useLiveSubscription<TModel[]>(queryKey, (onData, onError) => {
    const queries = buildQueries(db);
    const results: (TModel[] | undefined)[] = queries.map(() => undefined);
    let failed = false;

    function publish() {
      if (failed || results.some((result) => result === undefined)) return;
      const byId = new Map<string, TModel>();
      for (const result of results) {
        for (const model of result ?? []) byId.set(idOf(model), model);
      }
      onData([...byId.values()]);
    }

    if (queries.length === 0) {
      onData([]);
      return () => undefined;
    }
    const stops = queries.map((query, index) =>
      onSnapshot(
        query,
        (snapshot) => {
          results[index] = snapshot.docs.map((document) => document.data());
          publish();
        },
        (error) => {
          failed = true;
          onError(error);
        },
      ),
    );
    return () => stops.forEach((stop) => stop());
  });
}
