// File : /TeamSamsara.Workflow/app/src/core/data/useLiveDocument.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : One document, kept current as it changes. A path of null means
// "nothing yet" (for example, nobody signed in). A document that doesn't exist
// comes back as ready with null.

import {
  doc,
  onSnapshot,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LiveResult } from "./liveTypes";
import { useLiveSubscription } from "./useLiveSubscription";

/**
 * @param path The document path, e.g. "config/workspace", or null.
 * @param converter A model's converter. Keep it a module constant.
 */
export function useLiveDocument<TModel>(
  path: string | null,
  converter: FirestoreDataConverter<TModel>,
): LiveResult<TModel | null> {
  return useLiveSubscription<TModel | null>(path, (onData, onError) =>
    onSnapshot(
      doc(db, path ?? "").withConverter(converter),
      (snapshot) => onData(snapshot.exists() ? snapshot.data() : null),
      onError,
    ),
  );
}
