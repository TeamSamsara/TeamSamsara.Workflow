// File : /TeamSamsara.Workflow/app/src/shared/hooks/useCountdown.ts
// Version : 1.0.0
// Latest commit: feature/auth-screens
// Author : Gerrah
// Purpose : A countdown in whole seconds, for "Resend in 0:42" buttons. It can
// start running straight away; start() begins it again from the full length.

import { useCallback, useEffect, useState } from "react";

const oneSecondMs = 1000;
const secondsPerMinute = 60;

export interface Countdown {
  /** Seconds left; 0 when finished or never started. */
  secondsLeft: number;
  start: () => void;
}

export function useCountdown(
  lengthSeconds: number,
  startRunning = false,
): Countdown {
  const [endsAt, setEndsAt] = useState<number | null>(() =>
    startRunning ? Date.now() + lengthSeconds * oneSecondMs : null,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) window.clearInterval(timer);
    }, oneSecondMs);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const start = useCallback(() => {
    const current = Date.now();
    setNow(current);
    setEndsAt(current + lengthSeconds * oneSecondMs);
  }, [lengthSeconds]);

  const secondsLeft =
    endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / oneSecondMs));

  return { secondsLeft, start };
}

/** 42 → "0:42", 75 → "1:15". */
export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / secondsPerMinute);
  const rest = String(seconds % secondsPerMinute).padStart(2, "0");
  return `${minutes}:${rest}`;
}
