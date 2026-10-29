// File : /TeamSamsara.Workflow/app/src/core/data/liveTypes.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : The shape every live read returns, so screens handle loading and
// errors the same way everywhere.

import type { DataErrorKind } from "./dataErrors";

/**
 * idle: nothing asked for yet (no path). loading: waiting for the first answer.
 * ready: data is here and stays current. error: it could not be read.
 */
export type LiveStatus = "idle" | "loading" | "ready" | "error";

export interface LiveResult<TData> {
  status: LiveStatus;
  /** Present once status is "ready". */
  data: TData | undefined;
  /** Present once status is "error". */
  error: DataErrorKind | null;
}
