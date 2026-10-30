// File : /TeamSamsara.Workflow/app/src/shared/hooks/useCopyToClipboard.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : Copies text and says "Copied" for a moment after, per item.

import { useEffect, useState } from "react";

const copiedForMs = 2000;

export function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (copiedKey === null) return;
    const timer = window.setTimeout(() => setCopiedKey(null), copiedForMs);
    return () => window.clearTimeout(timer);
  }, [copiedKey]);

  return {
    /** Which item was copied last, while "Copied" shows. */
    copiedKey,
    copy: async (key: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}
