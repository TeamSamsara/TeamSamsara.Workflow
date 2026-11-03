// File : /TeamSamsara.Workflow/app/src/features/task-setup/index.ts
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : What other layers may use from the task setup feature: the
// workspace's statuses, event types and tags.

export { useEventTypes, useStatuses, useTags } from "./hooks/useSetupLists";
export type { SetupList } from "./hooks/useSetupLists";
export { saveSetupOrder } from "./service/setupListService";
export type { SetupListName } from "./service/setupListService";
export { addStartingStatuses } from "./service/startingStatuses";
export {
  categoryChangeBlocker,
  deleteStatusBlocker,
  RequiredCategories,
  startingStatus,
} from "./service/statusRules";
export { ColouredItemDialog } from "./ui/ColouredItemDialog";
export type { ColouredListName } from "./ui/ColouredItemDialog";
export { SetupListCard } from "./ui/SetupListCard";
export { StatusDialog } from "./ui/StatusDialog";
export { StatusPill } from "./ui/StatusPill";
export { TagChip } from "./ui/TagChip";
export { StatusCategoryText } from "./ui/taskSetupContent";
