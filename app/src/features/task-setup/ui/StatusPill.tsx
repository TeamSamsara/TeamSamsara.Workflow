// File : /TeamSamsara.Workflow/app/src/features/task-setup/ui/StatusPill.tsx
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : A status shown as a pill in its colour.

import type { StatusRecord } from "@/core/data";
import { Pill } from "@/shared/components/Pill/Pill";

export function StatusPill({
  status,
}: {
  status: Pick<StatusRecord, "name" | "tone">;
}) {
  return <Pill tone={status.tone}>{status.name}</Pill>;
}
