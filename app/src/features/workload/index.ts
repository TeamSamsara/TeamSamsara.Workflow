// File : /TeamSamsara.Workflow/app/src/features/workload/index.ts
// Version : 1.1.0
// Latest commit: feature/1.2-workload-b
// Author : Gerrah
// Purpose : What other layers may use from the workload feature: someone's
// week and the cards and pills that show it.

export { useMemberWeeks } from "./hooks/useMemberWeeks";
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
