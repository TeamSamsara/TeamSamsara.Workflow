// File : /TeamSamsara.Workflow/app/src/features/workflows/model/orderRulesContent.ts
// Version : 1.0.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : The words for order rules: the choices in each dropdown, the
// problems the checks find, and the pieces of the Reads-as sentence.

export const OrderRulesText = {
  relation: {
    after: "Comes after",
    before: "Comes before",
    with: "Starts with",
    dueFrom: "Due from",
  },
  relationHelp: {
    after: "This step follows that one.",
    before: "That step follows this one. The same link, set from this side.",
    with: "They unlock together, so they can be done side by side.",
    dueFrom:
      "Its due time counts from when that step is done, not from the event.",
  },
  condition: {
    done: "Done first",
    approved: "Approved first",
    inReview: "Sent for review first",
    liveLink: "Live link added first",
    order: "Nothing, only the order",
  },
  conditionHelp: {
    done: "Locked until that step is done.",
    approved: "Locked until it's approved.",
    inReview: "Unlocks as soon as it goes to review, before the approval.",
    liveLink: "Unlocks once its live link is added.",
    order: "Due after it, never locked.",
  },
  together: "Unlock together",
  whenDone: "When it's done",
  taken: (name: string) => `${name} (already in a rule)`,
  loops: (name: string) => `${name} (would loop)`,
  dueLater: (name: string) => `${name} (not due before this one)`,
  dueEarlier: (name: string) => `${name} (not due after this one)`,
  needsApproval: (label: string) => `${label} (it doesn't need approval)`,
  needsLiveLink: (label: string) => `${label} (it doesn't ask for one)`,
  loopProblem: (name: string) =>
    `This and ${name} wait on each other, so neither could start. Remove one of the rules.`,
  sameMoment: (name: string) =>
    `Due at the same moment as ${name}, which comes first. It has to be later.`,
  dueBefore: (name: string) =>
    `Due before ${name}, which comes first. It has to be later.`,
  noApproval: (name: string) =>
    `${name} doesn't need approval, so it can't be approved or sent for review first.`,
  noLiveLink: (name: string) =>
    `${name} doesn't ask for a live link, so one can't be added first.`,
  readsAs: {
    start: "On each event, ",
    gets: " gets this ",
    nobody: "nobody is given this yet. It's due ",
    locked: " It stays locked until ",
    condition: {
      done: "is done",
      approved: "is approved",
      inReview: "is sent for review",
      liveLink: "has its live link",
    },
    and: " and ",
    or: " or ",
    dueAfter: " It's due after ",
    countsFrom: " Its due time counts from when ",
    isDone: " is done.",
    together: " It unlocks together with ",
    cantStart: (condition: string) => ` can't start until this ${condition}.`,
    unlockLate: " If what it waits on is late, it unlocks at its own due time.",
    priority: {
      high: " High priority,",
      normal: " Normal priority,",
      low: " Low priority,",
    },
    approval: " needs approval.",
    noApproval: " no approval.",
  },
} as const;
