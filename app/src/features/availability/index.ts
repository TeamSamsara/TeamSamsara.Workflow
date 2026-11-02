// File : /TeamSamsara.Workflow/app/src/features/availability/index.ts
// Version : 1.1.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : What other layers may use from the availability feature.

export {
  useAllAvailability,
  useAvailability,
  useBusyInRange,
  usePersonalInRange,
} from "./hooks/useAvailability";
export { useWhoCanMake } from "./hooks/useWhoCanMake";
export type { Span, WhoCanMake } from "./hooks/useWhoCanMake";
export { checkPerson, isAvailableAt, stretches } from "./model/freeBusy";
export type { PersonTime } from "./model/freeBusy";
export { saveAvailability } from "./service/availabilityService";
export type {
  AvailabilityException,
  AvailabilityRecord,
  PersonalEntry,
} from "./types/availabilityTypes";
export { AvailabilityCheck } from "./ui/AvailabilityCheck";
export {
  CheckText,
  MyAvailabilityText,
  PersonalText,
  TeamText,
} from "./ui/availabilityContent";
export { ExceptionsCard } from "./ui/ExceptionsCard";
export { PersonalDialog } from "./ui/PersonalDialog";
export { PersonalItem } from "./ui/PersonalItem";
export { bestTimes } from "./model/teamTimes";
export { TeamAvailabilityGrid } from "./ui/TeamAvailabilityGrid";
export type { TeamEvent, TeamPerson } from "./ui/TeamAvailabilityGrid";
export { WeekPainter } from "./ui/WeekPainter";
