// File : /TeamSamsara.Workflow/app/src/shared/hooks/useNow.ts
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : The current time, refreshed every minute, so "Late" and "Today"
// move on while a page stays open.

import { useEffect, useState } from "react";

const minuteMs = 60_000;

export function useNow(everyMs: number = minuteMs): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), everyMs);
    return () => window.clearInterval(timer);
  }, [everyMs]);
  return now;
}
