// File : /TeamSamsara.Workflow/app/src/features/work-groups/index.ts
// Version : 1.2.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : What other layers may use from the work groups feature.

export { useWorkGroup } from "./hooks/useWorkGroup";
export { useWorkGroupDraft } from "./hooks/useWorkGroupDraft";
export type { WorkGroupDraft } from "./hooks/useWorkGroupDraft";
export { useWorkGroups } from "./hooks/useWorkGroups";
export type { WorkGroupList } from "./hooks/useWorkGroups";
export {
  addToWorkGroup,
  removeFromWorkGroup,
} from "./service/workGroupService";
export {
  canLeadGroups,
  checkLink,
  LeadPermissions,
} from "./service/groupRules";
export { WorkGroupLimits, workGroupConverter } from "./types/workGroupTypes";
export type {
  WorkGroupFields,
  WorkGroupLink,
  WorkGroupListItem,
  WorkGroupRecord,
} from "./types/workGroupTypes";
export { DeleteWorkGroupDialog } from "./ui/DeleteWorkGroupDialog";
export { NewWorkGroupDialog } from "./ui/NewWorkGroupDialog";
export { WorkGroupForm } from "./ui/WorkGroupForm";
export { WorkGroupGrid } from "./ui/WorkGroupGrid";
export { WorkGroupLinksEditor } from "./ui/WorkGroupLinksEditor";
export { WorkGroupLeadsText, WorkGroupLinksText } from "./ui/workGroupsContent";
export { WorkGroupPicker } from "./ui/WorkGroupPicker";
