// File : /TeamSamsara.Workflow/app/src/features/events/ui/lateTasksContent.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : What the warning says when planning makes tasks that are already
// late, and the "Late from the start" label those tasks carry.

const tasks = (count: number) => (count === 1 ? "1 task" : `${count} tasks`);

export const LateTasksText = {
  title: (count: number) =>
    count === 1
      ? "1 task would already be late"
      : `${count} tasks would already be late`,
  oneEvent: (when: string) =>
    `The event is ${when}. The workflow wants these done before now:`,
  severalEvents: "The workflows want these done before now:",
  more: (count: number) => `and ${tasks(count)} more`,
  choices: "What to do with them",
  late: "Create them as late",
  lateHelp: 'Recommended. They show as late, marked "Late from the start".',
  skip: "Leave them out",
  skipHelp: "They won't be made for this event.",
} as const;
