// File : /TeamSamsara.Workflow/app/src/features/roles/ui/RoleChip.tsx
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : A role's name in a rounded chip with its colour dot, used wherever
// a role is shown next to a person.

import type { RoleRecord } from "@/core/data";
import { Chip } from "@/shared/components/Chip/Chip";

interface RoleChipProps {
  role: Pick<RoleRecord, "name" | "color">;
  /** Shows a remove button that calls this. */
  onRemove?: () => void;
  className?: string;
}

export function RoleChip({ role, onRemove, className }: RoleChipProps) {
  return (
    <Chip
      label={role.name}
      color={role.color}
      variant="outline"
      onRemove={onRemove}
      className={className}
    />
  );
}
