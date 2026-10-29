// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberStatusPill.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A member's status as a pill: Active in green, Invited in blue,
// Disabled and Removed in grey.

import type { MemberStatus } from "@/core/data";
import { Pill, type PillTone } from "@/shared/components/Pill/Pill";
import { MemberStatusText } from "./membersContent";

const toneFor: Record<MemberStatus, PillTone> = {
  active: "success",
  invited: "info",
  disabled: "muted",
  removed: "muted",
};

export function MemberStatusPill({ status }: { status: MemberStatus }) {
  return <Pill tone={toneFor[status]}>{MemberStatusText[status]}</Pill>;
}
