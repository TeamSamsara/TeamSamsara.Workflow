// File : /TeamSamsara.Workflow/app/src/features/availability/index.ts
// Version : 1.2.0
// Latest commit: feature/audit-fixes
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
export { useTeamViewPrefs } from "./hooks/useTeamViewPrefs";
export {
  everyoneFree,
  FirstHour,
  freeStretches,
  hourRows,
} from "./model/hourGrid";
export type { GridPerson, HourCell } from "./model/hourGrid";
export { reorderSection, sectionsOf } from "./model/teamSections";
export { hoursApart, zoneFor } from "./model/viewZone";
export type { ZoneChoice } from "./model/viewZone";
export { HourPanel } from "./ui/HourPanel";
export type { PanelPerson } from "./ui/HourPanel";
export { TeamHourGrid } from "./ui/TeamHourGrid";
export { TeamPeopleList } from "./ui/TeamPeopleList";
export type { DayCell, TeamRowPerson } from "./ui/TeamPeopleList";
export { TeamViewText } from "./ui/teamViewContent";
export { UsualWeekStrip } from "./ui/UsualWeekStrip";
export { ZoneSwitch } from "./ui/ZoneSwitch";
export { WeekPainter } from "./ui/WeekPainter";
