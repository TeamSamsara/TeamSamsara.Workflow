// File : /TeamSamsara.Workflow/app/src/features/events/hooks/audienceQueries.ts
// Version : 1.0.0
// Latest commit: feature/calendar-people
// Author : Gerrah
// Purpose : The queries that read events or repeats for a calendar. The rules
// only let a member read what they're allowed to see, so each query asks for
// one thing the rules can check: for Everyone, with me, with one of my work
// groups, or made by me. View all reads everything in one go.

import {
  query,
  where,
  type CollectionReference,
  type Query,
  type QueryConstraint,
} from "firebase/firestore";
import type { CalendarScope, Viewer } from "../model/calendarScope";

export function audienceQueries<T>(
  base: CollectionReference<T>,
  scope: CalendarScope,
  viewer: Viewer,
  constraints: readonly QueryConstraint[] = [],
): Query<T>[] {
  const ask = (...filters: QueryConstraint[]) =>
    query(base, ...filters, ...constraints);
  const forEveryone = ask(where("everyone", "==", true));
  const forGroup = (groupId: string) =>
    ask(where("groupIds", "array-contains", groupId));
  switch (scope.kind) {
    case "all":
      return [ask()];
    case "group":
      return [forGroup(scope.groupId), forEveryone];
    case "groups":
      return [...viewer.workGroupIds.map(forGroup), forEveryone];
    case "mine":
      return [
        forEveryone,
        ask(where("memberIds", "array-contains", viewer.id)),
        ...viewer.workGroupIds.map(forGroup),
        ask(where("createdBy", "==", viewer.id)),
      ];
  }
}

/** A key that changes whenever the queries would. */
export function audienceKey(scope: CalendarScope, viewer: Viewer): string {
  const groups = [...viewer.workGroupIds].sort().join(",");
  return `${scope.kind}:${scope.kind === "group" ? scope.groupId : ""}:${viewer.id}:${groups}`;
}
