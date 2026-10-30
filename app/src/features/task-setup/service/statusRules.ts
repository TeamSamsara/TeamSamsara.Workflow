// File : /TeamSamsara.Workflow/app/src/features/task-setup/service/statusRules.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : What keeps the status list working: there must always be at least
// one status that counts as open (where tasks start) and one that counts as
// finished (where they end). Deleting the last of either, or changing it to
// count as something else, is refused. New tasks start at the first open one.

import type { StatusCategory, StatusRecord } from "@/core/data";

/** The categories the list can never be without. */
export const RequiredCategories: readonly StatusCategory[] = [
  "open",
  "finished",
];

/** The required category this change would leave with no status, or null. */
function emptiedCategory(
  statuses: readonly StatusRecord[],
  id: string,
  nextCategory: StatusCategory | null,
): StatusCategory | null {
  const status = statuses.find((item) => item.id === id);
  if (!status || status.category === nextCategory) return null;
  if (!RequiredCategories.includes(status.category)) return null;
  const others = statuses.filter(
    (item) => item.id !== id && item.category === status.category,
  );
  return others.length === 0 ? status.category : null;
}

/** Why the status can't be deleted (the category it would empty), or null. */
export function deleteStatusBlocker(
  statuses: readonly StatusRecord[],
  id: string,
): StatusCategory | null {
  return emptiedCategory(statuses, id, null);
}

/** Why the status can't change to this category, or null. */
export function categoryChangeBlocker(
  statuses: readonly StatusRecord[],
  id: string,
  category: StatusCategory,
): StatusCategory | null {
  return emptiedCategory(statuses, id, category);
}

/** Where new tasks start: the first status (in order) that counts as open. */
export function startingStatus(
  statuses: readonly StatusRecord[],
): StatusRecord | undefined {
  return [...statuses]
    .sort((a, b) => a.position - b.position)
    .find((status) => status.category === "open");
}
