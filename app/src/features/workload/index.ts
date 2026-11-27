// File : /TeamSamsara.Workflow/app/src/features/workload/index.ts
// Version : 1.2.0
// Latest commit: feature/1.2-workload-c
// Author : Gerrah
// Purpose : What other layers may use from the workload feature: someone's
// week and the cards and pills that show it.

export { useGroupWeeks } from "./hooks/useGroupWeeks";
export type { GroupWeeksRecord } from "./hooks/useGroupWeeks";
export { useMemberWeeks } from "./hooks/useMemberWeeks";
export { groupComingWeeks, workloadWarnings } from "./model/warnings";
export type { PlannedForWarning, WorkloadWarning } from "./model/warnings";
export { GroupWeeksCard } from "./ui/GroupWeeksCard";
export { WorkloadWarningNotice } from "./ui/WorkloadWarningNotice";
export type { MemberWeeksRecord } from "./hooks/useMemberWeeks";
export {
  comingWeeks,
  fits,
  memberWeek,
  stateAt,
  usualWeekOf,
  weekRange,
} from "./model/week";
export type { MemberWeek, TaskForWeek, WeekSettings } from "./model/week";
export { MemberWorkloadCard } from "./ui/MemberWorkloadCard";
export { WeekLegend } from "./ui/WeekLegend";
export { WeekPill } from "./ui/WeekPill";
export { YourWeekCard } from "./ui/YourWeekCard";
export { WeekStateText, WorkloadText } from "./ui/workloadContent";
