// File : /TeamSamsara.Workflow/app/src/features/workload/ui/workloadContent.ts
// Version : 1.2.0
// Latest commit: feature/1.2-workload-checks
// Author : Gerrah
// Purpose : The words for workload: what each week word means, your week on
// My tasks, a member's usual week, and a group's.

import type { WeekState } from "@engine/workload";

export const WeekStateText: Record<
  WeekState,
  { label: string; meaning: string }
> = {
  available: {
    label: "Available",
    meaning: "Room for more this week, even a bigger task",
  },
  limited: {
    label: "Limited",
    meaning: "Room for a quick task, not a bigger one",
  },
  atCapacity: {
    label: "At capacity",
    meaning: "No room: new tasks go to someone else or wait",
  },
  over: {
    label: "Over capacity",
    meaning: "Given more than their week through an override",
  },
};

export const WorkloadText = {
  usualWeek: (tasks: number) =>
    tasks === 1 ? "About 1 task a week" : `About ${tasks} tasks a week`,
  workspaceUsual: (tasks: number) =>
    `${tasks === 1 ? "About 1 task a week" : `About ${tasks} tasks a week`} (the workspace's usual)`,
  weekSummary: (range: string, tasks: number, bigger: number) =>
    `${range} · ${
      tasks === 0 ? "no tasks" : tasks === 1 ? "1 task" : `${tasks} tasks`
    }${bigger === 0 ? "" : bigger === tasks ? (tasks === 1 ? ", a bigger one" : ", all bigger ones") : bigger === 1 ? ", one of them a bigger one" : `, ${bigger} of them bigger ones`}`,
  yourWeek: "Your week",
  yourWeekNote:
    "Your usual week is set by your Owners and Administrators. Tell your lead if it should change.",
  legendTitle: "What people see",
  legendNote:
    "Weeks start on the day set above. A task's size comes from what it asks for: its checklist, the platforms it posts to and whether it needs approval.",
  workloadHeading: "Workload",
  everyone: "Everyone's usual week",
  everyoneHint:
    "Where new members start. Someone with their own usual week, set on their member page, keeps it.",
  memberTitle: (name: string) => `${name}'s usual week`,
  memberHelp: (name: string) =>
    `How much ${name} can take on in a week. Bigger tasks count for more on their own. Only Owners and Administrators see and change this; ${name} and their leads see Available, Limited or At capacity.`,
  followWorkspace: (tasks: number) =>
    `The workspace's usual (about ${tasks} ${tasks === 1 ? "task" : "tasks"})`,
  thisWeek: "This week",
  comingWeeks: "Coming weeks",
  groupTitle: (group: string) => `${group}'s usual week`,
  groupHelp: (group: string) =>
    `How much ${group} takes on in a week, all of it together. Planning past it only warns. Set by Owners and Administrators.`,
  noGroupWeek: "None: no planning warnings",
  adminsOnly: "Only Owners and Administrators change usual weeks.",
  saved: "Saved",
  failed: "Couldn't change that",
  groupWeeks: (group: string) => `${group}'s next four weeks`,
  groupWeeksNote:
    "From the group's usual week and the tasks it already has, all of it together.",
} as const;

export const WarningText = {
  title: "Workload warning.",
  over: (group: string, week: string) =>
    `This puts ${group} over capacity the week of ${week}.`,
  already: (group: string, state: WeekState) =>
    `${group} is already ${WeekStateText[state].label.toLowerCase()} that week.`,
  still:
    "You can still create it; tasks nobody has room for wait for someone in the group.",
  stillSeveral:
    "You can still create them; tasks nobody has room for wait for someone in the group.",
} as const;
