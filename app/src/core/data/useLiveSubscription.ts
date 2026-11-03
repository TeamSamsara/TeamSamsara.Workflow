// File : /TeamSamsara.Workflow/app/src/core/data/useLiveSubscription.ts
// Version : 1.1.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : The engine behind the live hooks. It listens while the component is
// on screen, starts over when the key changes, and stops when the component goes.
// Each answer is stamped with the key it belongs to, so an answer for an old key
// is never shown as the new one.

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import type { Unsubscribe } from "firebase/firestore";
import { dataErrorKind, type DataErrorKind } from "./dataErrors";
import type { LiveResult } from "./liveTypes";

/** Starts listening; calls onData with every new value and onError once if it fails. */
export type LiveListener<TData> = (
  onData: (data: TData) => void,
  onError: (error: unknown) => void,
) => Unsubscribe;

interface Answer<TData> {
  key: string;
  data: TData | undefined;
  error: DataErrorKind | null;
}

const idle = { status: "idle", data: undefined, error: null } as const;
const loading = { status: "loading", data: undefined, error: null } as const;

export function useLiveSubscription<TData>(
  key: string | null,
  listen: LiveListener<TData>,
): LiveResult<TData> {
  const [answer, setAnswer] = useState<Answer<TData> | null>(null);
  const startListening = useEffectEvent(listen);

  useEffect(() => {
    if (key === null) return;
    return startListening(
      (data) => setAnswer({ key, data, error: null }),
      (error) =>
        setAnswer({ key, data: undefined, error: dataErrorKind(error) }),
    );
  }, [key]);

  // The same object comes back until the answer changes, so it is safe in memo deps.
  return useMemo<LiveResult<TData>>(() => {
    if (key === null) return idle;
    if (answer === null || answer.key !== key) return loading;
    if (answer.error) {
      return { status: "error", data: undefined, error: answer.error };
    }
    return { status: "ready", data: answer.data, error: null };
  }, [key, answer]);
}
