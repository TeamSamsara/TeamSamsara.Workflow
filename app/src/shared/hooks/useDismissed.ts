// File : /TeamSamsara.Workflow/app/src/shared/hooks/useDismissed.ts
// Version : 1.0.0
// Latest commit: fix/workflow-editor-simpler
// Author : Gerrah
// Purpose : Remembers in this browser that the person closed something (an
// intro card), so it stays closed; it can be shown again.

import { useState } from "react";
import { browserStorage } from "@/lib/browserStorage";

export function useDismissed(storageKey: string) {
  const [dismissed, setDismissed] = useState(
    () => browserStorage.read(storageKey) === "true",
  );
  return {
    dismissed,
    dismiss: () => {
      browserStorage.write(storageKey, "true");
      setDismissed(true);
    },
    show: () => {
      browserStorage.remove(storageKey);
      setDismissed(false);
    },
  };
}
