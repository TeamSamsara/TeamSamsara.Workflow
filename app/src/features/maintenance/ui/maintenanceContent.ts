// File : /TeamSamsara.Workflow/app/src/features/maintenance/ui/maintenanceContent.ts
// Version : 1.1.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The words of the Database maintenance card.

export const MaintenanceText = {
  title: "Database maintenance",
  description:
    "Every Sunday at 4 AM (Toronto time) a check-up looks for data that points at deleted things (a task whose event is gone, a group that no longer exists) and for photos nothing uses. It never deletes real work: finished tasks stay as history.",
  apply: "Apply the fixes",
  applyHelp:
    "Off: each run only reports what it would fix. Turn it on once a report looks right.",
  runNow: "Run now",
  ran: (total: number, files: number, applied: boolean) =>
    `${applied ? "Fixed" : "Found"} ${total} ${total === 1 ? "thing" : "things"} in the database and ${files} unused ${files === 1 ? "file" : "files"}`,
  runFailed: "The check-up didn't run",
  saveFailed: "Couldn't save the switch",
  lastRuns: "Latest runs",
  never: "It hasn't run yet.",
  mode: { report: "Report only", apply: "Applied" },
  trigger: { weekly: "Weekly", manual: "Run now" } as Record<string, string>,
  clean: "Nothing to fix.",
  files: (count: number) =>
    count === 1 ? "1 unused file" : `${count} unused files`,
  kinds: {
    delete: "to delete",
    update: "to fix",
  } as Record<string, string>,
  collections: {
    tasks: "tasks",
    events: "events",
    repeats: "repeats",
    members: "members",
    workGroups: "work groups",
    personal: "appointments",
    busy: "busy copies",
    notifications: "notifications",
    sentReminders: "reminder records",
    workflowSyncs: "sync records",
    bulkPlans: "planning records",
  } as Record<string, string>,
} as const;

export const PlatformUpdatesText = {
  title: "Platform updates",
  description:
    "Changes to the stored data that come with a new version of Playbook. They run by themselves shortly after a release.",
  check: "Check",
  checking: "Checking what each update would change",
  apply: "Apply now",
  applied: (count: number) =>
    count === 0
      ? "Nothing to apply"
      : count === 1
        ? "1 update applied"
        : `${count} updates applied`,
  failed: "The updates couldn't run",
  notChecked:
    "Check to see which updates have run and what any pending ones would change.",
  pending: "Pending",
  done: "Applied",
  more: (count: number) => `and ${count} more`,
} as const;
