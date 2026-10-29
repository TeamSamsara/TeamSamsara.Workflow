// File : /TeamSamsara.Workflow/app/src/core/session/SessionContext.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : The context that shares the session worked out by SessionProvider.
// Context only; the hook that reads it is useSession.

import { createContext } from "react";
import type { SessionState } from "./sessionTypes";

export const SessionContext = createContext<SessionState | undefined>(
  undefined,
);
