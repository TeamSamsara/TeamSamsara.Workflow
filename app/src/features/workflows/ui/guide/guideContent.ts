// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/guide/guideContent.ts
// Version : 1.1.0
// Latest commit: fix/general-wording
// Author : Gerrah
// Purpose : The words of the guided workflow setup, one block per step.

export const GuideText = {
  steps: {
    name: {
      label: "Name it",
      title: "What kind of event is this for?",
      body: "Name it after the kind of event it's for: a match, a content drop, a sponsor activation, a meeting. You'll pick it by this name when you plan one.",
      name: "Workflow name",
      namePlaceholder: "Match day",
      description: "What it's for (optional)",
      descriptionPlaceholder:
        "Graphics, posts and co-streamers around each match.",
    },
    tasks: {
      label: "List the tasks",
      title: "What needs doing every time?",
      body: "Add each task in a few words. Think of everything before, during and after the event.",
      input: "New task",
      inputPlaceholder: "Sponsor post",
      add: "Add",
      suggestions: "Common tasks",
      remove: (title: string) => `Remove ${title}`,
      count: (count: number) => (count === 1 ? "1 task" : `${count} tasks`),
      none: "No tasks yet. Type one above or pick a common one.",
    },
    who: {
      label: "Who does each",
      title: "Who does each task?",
      body: "Give a task to a work group and anyone in it can take it, or give it to one person. Not sure yet? Leave it and decide later.",
    },
    when: {
      label: "When it's due",
      title: "When is each task due?",
      body: 'Due times are counted from when the event starts. If a match starts Monday at 7:00 PM, "The day before" means Sunday at 7:00 PM.',
    },
    review: {
      label: "Check and create",
      title: "Does this look right?",
      body: "Tasks are listed in the order they're due. After you create it you can open any task to add post text, a checklist, links or approval.",
      unassigned: "No one yet",
    },
  },
  cancel: "Cancel",
  back: "Back",
  next: "Continue",
  create: "Create workflow",
  needName: "Give the workflow a name to continue.",
  needTask: "Add at least one task to continue.",
  full: (max: number) => `A workflow holds up to ${max} tasks.`,
  createFailed: "The workflow couldn't be created",
} as const;
