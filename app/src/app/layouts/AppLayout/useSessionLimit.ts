// File : /TeamSamsara.Workflow/app/src/app/layouts/AppLayout/useSessionLimit.ts
// Version : 1.0.0
// Latest commit: feature/remember-me
// Author : Gerrah
// Purpose : Signs someone out once their sign-in is older than the workspace
// allows (Settings › General), checking when the app opens, when the tab comes
// back into view, and every half hour.

import { useEffect } from "react";
import { endSession, isPastLimit } from "@/core/session";

const every = 30 * 60 * 1000;

export function useSessionLimit(days: number) {
  useEffect(() => {
    if (days <= 0) return;
    let stopped = false;
    async function check() {
      if (document.visibilityState === "hidden") return;
      if (await isPastLimit(days).catch(() => false)) {
        if (!stopped) await endSession();
      }
    }
    void check();
    const timer = window.setInterval(() => void check(), every);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [days]);
}
