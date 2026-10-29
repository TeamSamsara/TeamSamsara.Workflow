// File : /TeamSamsara.Workflow/app/src/core/session/useSession.ts
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Reads SessionContext, and fails loudly when used outside SessionProvider.

import { useContext } from "react";
import { DevInvariants } from "@/lib/devInvariants";
import { SessionContext } from "./SessionContext";
import type { SessionState } from "./sessionTypes";

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error(DevInvariants.useSessionOutsideProvider);
  }
  return context;
}
