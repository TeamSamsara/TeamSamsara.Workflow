// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/tutorial/tutorialContent.ts
// Version : 1.1.0
// Latest commit: fix/general-wording
// Author : Gerrah
// Purpose : The words of the workflows tutorial: what a workflow is, who and
// when, using one on an event, and adding details; plus the examples drawn in it.

export const TutorialText = {
  dialogTitle: "Workflows in 1 minute",
  slides: [
    {
      title: "What's a workflow?",
      body: "A workflow is the list of tasks that happen every time you run a certain kind of event. It could be a match, a content drop, a sponsor activation or a meeting. Make it once, then reuse it every time.",
    },
    {
      title: "Each task says who and when",
      body: 'Give each task to a work group or to one person, and pick when it\'s due compared with the event, like "The day before".',
    },
    {
      title: "Use it on an event",
      body: "When you plan an event, pick the workflow. Its tasks are made for that event with real dates and show up in each person's My tasks.",
    },
    {
      title: "Add details when you need them",
      body: "Open a task to add what to post on each platform, a checklist, links, or to ask for approval. Start simple: you can add more any time.",
    },
  ],
  back: "Back",
  next: "Next",
  notNow: "Not now",
  gotIt: "Got it",
  start: "Create my first workflow",
  startAnother: "Make one with the guide",
  slideLabel: (index: number, total: number) => `${index + 1} of ${total}`,
  example: {
    workflow: "Match day",
    tasks: [
      "Announcement post",
      "Matchday graphic",
      "Co-streamer brief",
      "Results post",
    ],
    rows: [
      { title: "Matchday graphic", who: "Design", when: "The day before" },
      {
        title: "Co-streamer brief",
        who: "Partnerships",
        when: "3 hours before",
      },
      { title: "Results post", who: "Sam Rivera", when: "1 hour after" },
    ],
    event: "Mon 7:00 PM · vs. Team Nova",
    eventType: "Match",
    dated: [
      { when: "Sun 7:00 PM", title: "Matchday graphic" },
      { when: "Mon 4:00 PM", title: "Co-streamer brief" },
      { when: "Mon 8:00 PM", title: "Results post" },
    ],
    sections: [
      "Post text",
      "Checklist",
      "Reference links",
      "Link to what was published",
      "Needs approval",
    ],
  },
} as const;
