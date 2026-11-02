// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useTaskFormats.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : How an event's values read in its tasks' text: the workspace's
// time zone and formats (tasks are shared, so never one person's own), the
// fields with their types, members' names and event types' names.

import { useMemo } from "react";
import { useWorkspaceRecord } from "@/core/workspace";
import { useFields } from "@/features/fields";
import { memberName, useMembers } from "@/features/members";
import { useEventTypes } from "@/features/task-setup";
import type { Formats } from "../model/applyWorkflows";

export function useTaskFormats(): Formats {
  const workspace = useWorkspaceRecord();
  const fields = useFields();
  const members = useMembers();
  const eventTypes = useEventTypes();
  return useMemo<Formats>(
    () => ({
      timeZone: workspace.timeZone,
      clock: workspace.timeFormat,
      dateFormat: workspace.dateFormat,
      fields: fields.items,
      memberName: (id) => {
        const member = members.records.find((entry) => entry.id === id);
        return member ? memberName(member) : null;
      },
      eventTypeName: (id) =>
        eventTypes.items.find((type) => type.id === id)?.name ?? null,
    }),
    [
      workspace.timeZone,
      workspace.timeFormat,
      workspace.dateFormat,
      fields.items,
      members.records,
      eventTypes.items,
    ],
  );
}
