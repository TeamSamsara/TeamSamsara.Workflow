// File : /TeamSamsara.Workflow/app/src/features/whats-new/hooks/useWhatsNew.ts
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : What's new for the person signed in: the release to show them
// once (with only what they may see), and marking it seen.

import {
  releaseForViewer,
  releases,
  unseenRelease,
  type Release,
} from "@releases/index";
import { useCallback, useState } from "react";
import { usePermissions } from "@/core/access";
import { useSession } from "@/core/session";
import { markReleaseSeen } from "../service/whatsNewService";

export interface WhatsNew {
  /** The release to show them now; null when there's nothing new. */
  release: Release | null;
  /** Closes it for good: they've seen this release. */
  dismiss: () => void;
}

export function useWhatsNew(): WhatsNew {
  const session = useSession();
  const access = usePermissions();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const member = session.status === "active" ? session.member : null;
  const joinedOn = member?.joinedAt?.toISOString().slice(0, 10) ?? null;
  const unseen = member
    ? unseenRelease(releases, member.lastSeenRelease, joinedOn)
    : null;
  const release =
    unseen && unseen.version !== dismissed
      ? releaseForViewer(unseen, access.can("administrator"))
      : null;

  const dismiss = useCallback(() => {
    if (!member || !unseen) return;
    setDismissed(unseen.version);
    markReleaseSeen(member.id, unseen.version).catch((error: unknown) =>
      console.warn("What's new not marked as seen", error),
    );
  }, [member, unseen]);

  return { release, dismiss };
}
