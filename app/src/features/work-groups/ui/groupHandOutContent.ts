// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/groupHandOutContent.ts
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : The words of a group's hand-out panel: the switch, how it picks
// someone, the daily limit and heads-up, and who takes tasks.

export const GroupHandOutText = {
  title: "Hand out tasks automatically",
  on: (group: string) =>
    `On: each ${group} task goes to one person, by the rules below. Tasks waiting for someone show on My tasks for anyone in ${group} to claim.`,
  off: (group: string) =>
    `Off: ${group}'s tasks go to the whole group, and anyone in it does them.`,
  switchLabel: (group: string) => `Hand out ${group}'s tasks automatically`,
  rulesTitle: (group: string) => `Who gets ${group}'s tasks`,
  rules: [
    {
      lead: "A step that names someone",
      rest: " gives the task to them, even over the daily limit.",
    },
    {
      lead: "Otherwise, the least busy person who's free",
      rest: ": who takes tasks, has the fewest open tasks in the next 7 days, is free for at least an hour in the 6 hours before it's due, and is under the daily limit. A tie goes to whoever already has a task on that event.",
    },
    {
      lead: "If no one's free, it waits for someone.",
      rest: " Anyone in the group can claim it from My tasks; otherwise it goes to the first person who frees up.",
    },
  ],
  reach:
    "Tasks are handed out up to two weeks before they're due, so plans further ahead can still change.",
  leadsCant:
    "As a lead you choose who takes tasks; the switch, the daily limit and the heads-up are for people who manage work groups.",
  limitLabel: "Daily limit per person",
  limitHint: (min: number, max: number) =>
    `Tasks due the same day, between ${min} and ${max}. Tasks a step gives someone by name don't count.`,
  headsUpLabel: "Tell the leads when a task still has no one",
  headsUp: (hours: number) => `${hours} hours before it's due`,
  takersTitle: "Who takes tasks",
  takersHint:
    "Leads start as overseers, with Takes tasks off. Turn it on to hand them tasks too; a step that names a lead still gives the task to them.",
  lead: "Lead",
  member: "Member",
  load: (count: number) =>
    count === 1
      ? "1 open task in the next 7 days"
      : `${count} open tasks in the next 7 days`,
  lockedRank: "Above your rank",
  noMembers: "No one is in this group yet.",
  saved: "Saved",
  failed: "Couldn't change that",
  refusals: {
    outranked: "That person is above your rank.",
    missingPermission: "Only people who manage work groups can change that.",
    invalid: "That isn't a choice the group can take.",
  } as Record<string, string>,
} as const;
