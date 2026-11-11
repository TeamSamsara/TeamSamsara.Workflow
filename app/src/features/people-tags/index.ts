// File : /TeamSamsara.Workflow/app/src/features/people-tags/index.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : What the people tags feature offers the rest of the app.

export { usePeopleTags } from "@/features/task-setup";
export {
  deletePeopleTag,
  maxTagsPerMember,
  saveTeamView,
  setMemberTags,
} from "./service/peopleTagService";
export { PeopleTagsCard } from "./ui/PeopleTagsCard";
export { PeopleTagsText } from "./ui/peopleTagsContent";
export { TagEditor } from "./ui/TagEditor";
export { TagPill } from "./ui/TagPill";
