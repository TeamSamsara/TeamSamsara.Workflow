// File : /TeamSamsara.Workflow/app/src/features/onboarding/service/walkthroughService.ts
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : Saves a person's walkthrough on their own member record: the
// chapters they've done or skipped, and whether they hid its card. Kept there
// so it follows them to any device.

import { doc } from "firebase/firestore";
import { Collections, commitWrites, type Walkthrough } from "@/core/data";
import { db } from "@/lib/firebase";

export function saveWalkthrough(
  memberId: string,
  walkthrough: Walkthrough,
): Promise<void> {
  return commitWrites(db, [
    (batch) =>
      batch.update(doc(db, Collections.members, memberId), {
        walkthrough: {
          done: [...new Set(walkthrough.done)].slice(0, 30),
          hidden: walkthrough.hidden,
        },
      }),
  ]);
}
