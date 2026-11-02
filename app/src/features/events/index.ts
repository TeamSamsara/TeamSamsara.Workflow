// File : /TeamSamsara.Workflow/app/src/features/events/index.ts
// Version : 1.2.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : What other layers may use from the events feature.

export {
  useEvent,
  useSeesAllEvents,
  useSeesEventTasks,
  useEventProgress,
  useEventsInRange,
  useEventTasks,
  useSeesAllTasks,
  useStandaloneTasksInRange,
} from "./hooks/useEvents";
export type { Progress } from "./hooks/useEvents";
export { useRepeat, useRepeats, useRepeatTopUp } from "./hooks/useRepeats";
export { useAudienceOptions } from "./hooks/useAudienceOptions";
export type { AudienceOptions } from "./hooks/useAudienceOptions";
export { applyWorkflows, askedGaps, gapLabel } from "./model/applyWorkflows";
export type { Formats, PlannedTask } from "./model/applyWorkflows";
export {
  checkEventDraft,
  draftFromEvent,
  draftMinutes,
  emptyEventDraft,
  fieldsFromDraft,
} from "./model/eventDraft";
export type { EventDraft, EventDraftProblems } from "./model/eventDraft";
export {
  checkRepeatDraft,
  draftFromRepeat,
  scheduleFromDraft,
  scheduleOf,
  startRepeatDraft,
} from "./model/repeatDraft";
export type { RepeatDraft, RepeatDraftProblems } from "./model/repeatDraft";
export {
  occurrenceDate,
  occurrenceId,
  occurrenceStart,
  weekdayOf,
} from "./model/repeatRule";
export { describeRepeat } from "./model/repeatSummary";
export { createEvent, deleteEvent, saveEvent } from "./service/eventService";
export {
  createRepeat,
  editSeriesFrom,
  endRepeatAfter,
  previewRepeat,
  skipOccurrence,
} from "./service/repeatService";
export type { SeriesFields } from "./service/repeatService";
export { readScope, scopeValue } from "./model/calendarScope";
export type { CalendarScope, Viewer } from "./model/calendarScope";
export { involves } from "./types/audience";
export type { Audience } from "./types/audience";
export { AudienceText } from "./ui/audienceContent";
export { eventConverter, EventLimits } from "./types/eventTypes";
export type { EventFields, EventRecord } from "./types/eventTypes";
export { RepeatLimits } from "./types/repeatTypes";
export type { RepeatRecord, RepeatSchedule } from "./types/repeatTypes";
export { CalendarList } from "./ui/CalendarList";
export { CalendarMonth } from "./ui/CalendarMonth";
export { CalendarWeek } from "./ui/CalendarWeek";
export type { WeekEntry } from "./ui/CalendarWeek";
export { EventItem, SkippedItem, TaskItem } from "./ui/CalendarItem";
export { EventActions } from "./ui/EventActions";
export { EventActionsText } from "./ui/eventActionsContent";
export { EventForm } from "./ui/EventForm";
export { RepeatFields } from "./ui/RepeatFields";
export { RepeatFieldsText } from "./ui/repeatFieldsContent";
export { CalendarText } from "./ui/eventsContent";
export { TaskPreview } from "./ui/TaskPreview";
export { WorkflowPicker } from "./ui/WorkflowPicker";
