// File : /TeamSamsara.Workflow/app/src/features/events/model/calendarScope.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : Which calendar is shown: mine (what involves me), all my work
// groups, one work group, or everything (View all only). Kept in the address
// as cal=mine | groups | <work group id> | all.

export type CalendarScope =
  | { kind: "mine" }
  | { kind: "groups" }
  | { kind: "group"; groupId: string }
  | { kind: "all" };

export interface Viewer {
  id: string;
  workGroupIds: readonly string[];
}

/** The calendar a member can actually see for what the address asks. */
export function readScope(
  value: string | null,
  viewer: Viewer | null,
  seesAllEvents: boolean,
): CalendarScope {
  const groups = viewer?.workGroupIds ?? [];
  if (value === "all")
    return seesAllEvents ? { kind: "all" } : { kind: "mine" };
  if (value === "groups")
    return groups.length > 0 ? { kind: "groups" } : { kind: "mine" };
  if (value && value !== "mine" && (seesAllEvents || groups.includes(value)))
    return { kind: "group", groupId: value };
  return { kind: "mine" };
}

export function scopeValue(scope: CalendarScope): string {
  return scope.kind === "group" ? scope.groupId : scope.kind;
}
