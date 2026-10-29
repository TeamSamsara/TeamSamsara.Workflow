// File : /TeamSamsara.Workflow/app/src/core/access/usePermissions.ts
// Version : 1.0.0
// Latest commit: core/access
// Author : Gerrah
// Purpose : Reads AccessContext, and fails loudly when used outside AccessProvider.

import { useContext } from "react";
import { DevInvariants } from "@/lib/devInvariants";
import { AccessContext, type AccessState } from "./AccessContext";

export function usePermissions(): AccessState {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error(DevInvariants.useAccessOutsideProvider);
  }
  return context;
}
