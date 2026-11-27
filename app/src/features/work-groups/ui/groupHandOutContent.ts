// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/groupHandOutContent.ts
// Version : 2.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : The words of a group's hand-out panel: the switch, how it picks
// someone, the heads-up, and who takes tasks.

export const GroupHandOutText = {
  title: "Hand out tasks automatically",
  on: (group: string) =>
    `On: each ${group} task goes to one person: the least busy who has room and is free before it's due. Tasks nobody has room for wait on My tasks for anyone in ${group} to claim.`,
  off: (group: string) =>
    `Off: ${group}'s tasks go to the whole group, and anyone in it does them.`,
  switchLabel: (group: string) => `Hand out ${group}'s tasks automatically`,
  rulesTitle: (group: string) => `Who gets ${group}'s tasks`,
  rules: [
    {
      lead: "A task given to someone by name",
      rest: " goes to them.",
    },
    {
      lead: "Otherwise, the least busy person with room",
      rest: ": who takes tasks, has the most room in their week, and is free for at least an hour in the 6 hours before it's due. A tie goes to whoever already has a task on that event.",
    },
    {
      lead: "If no one has room, it waits.",
      rest: " Anyone in the group can claim it from My tasks; otherwise it goes to the first person who has room.",
    },
  ],
  reach:
    "Tasks are handed out up to two weeks before they're due, so plans further ahead can still change.",
  leadsCant:
    "As a lead you choose who takes tasks; the switch and the heads-up are for people who manage work groups.",
  headsUpLabel: "Tell the leads when a task still has no one",
  headsUp: (hours: number) => `${hours} hours before it's due`,
  takersTitle: "Who takes tasks",
  takersHint:
    "Leads start as overseers, with Takes tasks off. Turn it on to hand them tasks too; a task given to a lead by name still goes to them.",
  lead: "Lead",
  member: "Member",
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
