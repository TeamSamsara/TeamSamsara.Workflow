// File : /TeamSamsara.Workflow/app/src/features/whats-new/service/whatsNewService.ts
// Version : 1.0.0
// Latest commit: feature/whats-new
// Author : Gerrah
// Purpose : Remembers the newest release someone has seen in What's new, on
// their own member record, so the panel shows each release once.

import { doc, updateDoc } from "firebase/firestore";
import { Collections } from "@/core/data";
import { db } from "@/lib/firebase";

export function markReleaseSeen(
  memberId: string,
  version: string,
): Promise<void> {
  return updateDoc(doc(db, Collections.members, memberId), {
    "prefs.lastSeenRelease": version.slice(0, 20),
  });
}
