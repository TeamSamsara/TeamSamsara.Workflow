// File : /TeamSamsara.Workflow/app/src/features/task-setup/ui/TagChip.tsx
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : A tag (or event type) as a chip with its colour dot.

import type { ColouredItem } from "@/core/data";
import { Chip } from "@/shared/components/Chip/Chip";

interface TagChipProps {
  item: Pick<ColouredItem, "name" | "color">;
  onRemove?: () => void;
}

export function TagChip({ item, onRemove }: TagChipProps) {
  return <Chip label={item.name} color={item.color} onRemove={onRemove} />;
}
