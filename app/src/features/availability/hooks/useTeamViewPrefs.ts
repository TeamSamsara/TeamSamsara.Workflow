// File : /TeamSamsara.Workflow/app/src/features/availability/hooks/useTeamViewPrefs.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : How the signed-in member likes Team availability: who they hide,
// the order of names, and whose time it shows in. Changes show at once and
// are saved to their account a moment later, so they follow them to any
// device. A save that fails just keeps the change for this visit.

import { useEffect, useRef, useState } from "react";
import type { TeamViewPrefs } from "@/core/data";
import { useSession } from "@/core/session";
import { saveTeamView } from "@/features/people-tags";

const saveAfterMs = 800;
const nothing: TeamViewPrefs = { hidden: [], order: [], zone: "team" };

export function useTeamViewPrefs(): {
  prefs: TeamViewPrefs;
  change: (changes: Partial<TeamViewPrefs>) => void;
} {
  const session = useSession();
  const member = session.status === "active" ? session.member : null;
  const [edits, setEdits] = useState<TeamViewPrefs | null>(null);
  const timer = useRef<number | null>(null);
  const prefs = edits ?? member?.teamView ?? nothing;

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function change(changes: Partial<TeamViewPrefs>) {
    const next = { ...prefs, ...changes };
    setEdits(next);
    if (!member) return;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      saveTeamView(member.id, next).catch((error: unknown) =>
        console.warn("Team availability view not saved", error),
      );
    }, saveAfterMs);
  }

  return { prefs, change };
}
