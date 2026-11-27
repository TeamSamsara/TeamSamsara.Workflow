// File : /TeamSamsara.Workflow/app/src/features/workflows/model/orderRules.ts
// Version : 1.0.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : A workflow's order rules as links between steps: which step comes
// first and what has to happen before the next one can start. Finds loops,
// steps due too early, and conditions a step can't meet; lists the choices
// the editor offers for each rule; and builds the "Reads as" sentence.

import type { ClockFormat } from "@/shared/time/dates";
import type {
  DueOffset,
  OrderCondition,
  OrderRelation,
  OrderRule,
  WorkflowStep,
} from "../types/workflowTypes";
import { locks, orderLinks, type OrderLink } from "@engine/order";
import { describeDue, dueOrder } from "./dueOffset";
import { OrderRulesText as Text } from "./orderRulesContent";

// The links themselves are worked out by the engine, which the server shares.
export { locks, orderLinks } from "@engine/order";
export type { OrderLink } from "@engine/order";

/** Whether `to` can be reached from `from` by following links. */
function reaches(links: readonly OrderLink[], from: string, to: string) {
  const seen = new Set<string>();
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === to) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const link of links) if (link.from === current) queue.push(link.to);
  }
  return false;
}

/**
 * Whether a rule on `stepId` relating it to `otherId` would make a loop,
 * leaving out the rule being edited (`ignoreRuleId`).
 */
export function wouldLoop(
  steps: readonly WorkflowStep[],
  stepId: string,
  otherId: string,
  relation: OrderRelation,
  ignoreRuleId?: string,
): boolean {
  if (relation === "with") return false;
  const links = orderLinks(steps).filter(
    (link) => !(link.ownerId === stepId && link.ruleId === ignoreRuleId),
  );
  // A new link other → step loops when step already leads to other.
  return relation === "before"
    ? reaches(links, otherId, stepId)
    : reaches(links, stepId, otherId);
}

/** The step a rule waits on: the one that has to happen first. */
function firstOf(step: WorkflowStep, rule: OrderRule): string {
  return rule.relation === "before" ? step.id : rule.stepId;
}

export interface RuleChoice<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/** The relations, in the order the editor lists them. */
export function relationChoices(): RuleChoice<OrderRelation>[] {
  return (["after", "before", "with", "dueFrom"] as const).map((value) => ({
    value,
    label: Text.relation[value],
  }));
}

/** The other steps for a rule's step dropdown, each with why it can't be picked. */
export function stepChoices(
  steps: readonly WorkflowStep[],
  step: WorkflowStep,
  rule: OrderRule,
  untitled: (index: number) => string,
): RuleChoice<string>[] {
  const ownIndex = steps.findIndex((entry) => entry.id === step.id);
  return steps.flatMap((other, index) => {
    if (other.id === step.id) return [];
    const name = `${index + 1}. ${other.title.trim() || untitled(index)}`;
    const taken = step.order.some(
      (entry) => entry.id !== rule.id && entry.stepId === other.id,
    );
    if (taken)
      return [{ value: other.id, label: Text.taken(name), disabled: true }];
    if (wouldLoop(steps, step.id, other.id, rule.relation, rule.id))
      return [{ value: other.id, label: Text.loops(name), disabled: true }];
    const otherFirst = rule.relation !== "before";
    const early =
      rule.relation !== "with" &&
      (otherFirst
        ? dueOrder(other.due) >= dueOrder(step.due)
        : dueOrder(step.due) >= dueOrder(other.due));
    return [
      {
        value: other.id,
        // The chosen step keeps its plain name; its problem shows under the rule.
        label:
          early && ownIndex >= 0 && other.id !== rule.stepId
            ? (otherFirst ? Text.dueLater : Text.dueEarlier)(name)
            : name,
      },
    ];
  });
}

/** What can be asked to happen first, given which step comes first. */
export function conditionChoices(
  relation: OrderRelation,
  first: WorkflowStep | undefined,
): RuleChoice<OrderCondition>[] {
  if (relation === "with") return [{ value: "done", label: Text.together }];
  if (relation === "dueFrom") return [{ value: "done", label: Text.whenDone }];
  const approval = first?.needsApproval ?? false;
  const liveLink = first?.asksForLiveLink ?? false;
  return [
    { value: "done", label: Text.condition.done },
    {
      value: "approved",
      label: approval
        ? Text.condition.approved
        : Text.needsApproval(Text.condition.approved),
      disabled: !approval,
    },
    {
      value: "inReview",
      label: approval
        ? Text.condition.inReview
        : Text.needsApproval(Text.condition.inReview),
      disabled: !approval,
    },
    {
      value: "liveLink",
      label: liveLink
        ? Text.condition.liveLink
        : Text.needsLiveLink(Text.condition.liveLink),
      disabled: !liveLink,
    },
    { value: "order", label: Text.condition.order },
  ];
}

/** A step's order problem, with the rule it comes from when there's one. */
export interface OrderProblem {
  message: string;
  ruleId?: string;
  /** The step the problem is about, to open it. */
  otherId?: string;
  /** For a due time that's too early: a due time that works. */
  fix?: DueOffset;
}

/** Due a step later than `offset`, one hour on, keeping its kind. */
export function dueAfter(offset: DueOffset): DueOffset {
  if (offset.direction === "at")
    return { direction: "after", days: 0, hours: 1, minutes: 0, time: null };
  if (offset.time) {
    const [hour, minute] = offset.time.split(":").map(Number);
    if (hour < 23)
      return {
        ...offset,
        time: `${String(hour + 1).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      };
    // Past 11 PM: the next morning.
    const days =
      offset.direction === "before" ? offset.days - 1 : offset.days + 1;
    return days < 0
      ? { direction: "after", days: 0, hours: 0, minutes: 0, time: "08:00" }
      : { ...offset, days, time: "08:00", direction: offset.direction };
  }
  const total =
    (offset.direction === "before" ? -1 : 1) *
      (offset.days * 1440 + offset.hours * 60 + offset.minutes) +
    60;
  const direction = total < 0 ? "before" : total === 0 ? "at" : "after";
  const amount = Math.abs(total);
  return {
    direction,
    days: Math.floor(amount / 1440),
    hours: Math.floor((amount % 1440) / 60),
    minutes: amount % 60,
    time: null,
  };
}

/**
 * Every order problem, by step: links that loop, a step due before or at
 * the same moment as one it comes after, and conditions the first step
 * can't meet (approved without approval, a live link it doesn't ask for).
 */
export function orderProblems(
  steps: readonly WorkflowStep[],
  untitled: (index: number) => string,
): Record<string, OrderProblem[]> {
  const byId = new Map(steps.map((step) => [step.id, step]));
  const nameOf = (id: string) => {
    const index = steps.findIndex((step) => step.id === id);
    const step = steps[index];
    return `${index + 1}. ${step?.title.trim() || untitled(index)}`;
  };
  const problems: Record<string, OrderProblem[]> = {};
  const add = (id: string, problem: OrderProblem) => {
    (problems[id] ??= []).push(problem);
  };
  const links = orderLinks(steps);
  const looped = new Set<string>();
  for (const link of links) {
    // A link loops when its follower already leads back to it.
    if (looped.has(link.ruleId)) continue;
    const others = links.filter((entry) => entry !== link);
    if (reaches(others, link.to, link.from)) {
      // Every link of the same loop is reported once, here.
      const inLoop = new Set(
        steps
          .map((entry) => entry.id)
          .filter(
            (id) =>
              reaches(links, link.to, id) && reaches(links, id, link.from),
          ),
      );
      for (const other of links)
        if (inLoop.has(other.from) && inLoop.has(other.to))
          looped.add(other.ruleId);
      looped.add(link.ruleId);
      add(link.ownerId, {
        message: Text.loopProblem(
          nameOf(link.ownerId === link.to ? link.from : link.to),
        ),
        ruleId: link.ruleId,
      });
    }
  }
  for (const link of links) {
    const first = byId.get(link.from);
    const next = byId.get(link.to);
    if (!first || !next || looped.has(link.ruleId)) continue;
    const a = dueOrder(first.due);
    const b = dueOrder(next.due);
    if (b <= a && !link.dueFrom)
      add(link.to, {
        message: (b === a ? Text.sameMoment : Text.dueBefore)(
          nameOf(link.from),
        ),
        ruleId: link.ownerId === link.to ? link.ruleId : undefined,
        otherId: link.from,
        fix: dueAfter(first.due),
      });
    if (
      (link.condition === "approved" || link.condition === "inReview") &&
      !first.needsApproval
    )
      add(link.ownerId, {
        message: Text.noApproval(nameOf(link.from)),
        ruleId: link.ruleId,
      });
    if (link.condition === "liveLink" && !first.asksForLiveLink)
      add(link.ownerId, {
        message: Text.noLiveLink(nameOf(link.from)),
        ruleId: link.ruleId,
      });
  }
  return problems;
}

/** A link seen from one step: the other step and how they're linked. */
export interface StepLink {
  otherId: string;
  name: string;
  condition: OrderCondition;
  /** True when the other step comes first. */
  incoming: boolean;
}

/** The links into and out of a step, for "In the flow". */
export function linksOf(
  steps: readonly WorkflowStep[],
  stepId: string,
  untitled: (index: number) => string,
): StepLink[] {
  const nameOf = (id: string) => {
    const index = steps.findIndex((step) => step.id === id);
    return `${index + 1}. ${steps[index]?.title.trim() || untitled(index)}`;
  };
  return orderLinks(steps).flatMap((link): StepLink[] =>
    link.to === stepId
      ? [
          {
            otherId: link.from,
            name: nameOf(link.from),
            condition: link.condition,
            incoming: true,
          },
        ]
      : link.from === stepId
        ? [
            {
              otherId: link.to,
              name: nameOf(link.to),
              condition: link.condition,
              incoming: false,
            },
          ]
        : [],
  );
}

/** A piece of the Reads-as sentence; bold pieces are what the person picked. */
export interface ReadsAsPart {
  text: string;
  bold?: boolean;
}

export interface ReadsAsContext {
  /** Who it's given to, in words ("Marketing's least busy person"). */
  who: string | null;
  clockFormat: ClockFormat;
  untitled: (index: number) => string;
}

/** What the step will do on each event, in one plain sentence. */
/** "The day before at 5:00 PM" as "the day before at 5:00 PM". */
const lowerFirst = (text: string) =>
  text.charAt(0).toLowerCase() + text.slice(1);

export function readsAs(
  steps: readonly WorkflowStep[],
  step: WorkflowStep,
  context: ReadsAsContext,
): ReadsAsPart[] {
  const nameOf = (id: string) => {
    const index = steps.findIndex((entry) => entry.id === id);
    return `${index + 1}. ${steps[index]?.title.trim() || context.untitled(index)}`;
  };
  const parts: ReadsAsPart[] = [{ text: Text.readsAs.start }];
  if (context.who)
    parts.push({ text: context.who, bold: true }, { text: Text.readsAs.gets });
  else parts.push({ text: Text.readsAs.nobody });
  parts.push(
    {
      text: lowerFirst(describeDue(step.due, context.clockFormat)),
      bold: true,
    },
    { text: "." },
  );

  const links = orderLinks(steps);
  const waits = links.filter(
    (link) => link.to === step.id && locks(link.condition) && !link.dueFrom,
  );
  const ordered = links.filter(
    (link) => link.to === step.id && !locks(link.condition),
  );
  const dueFrom = links.filter((link) => link.to === step.id && link.dueFrom);
  const holds = links.filter(
    (link) => link.from === step.id && locks(link.condition),
  );
  const together = step.order.filter(
    (rule) => rule.relation === "with" && rule.stepId,
  );
  const list = (items: { text: string }[], joiner: string) => {
    items.forEach((item, index) => {
      if (index > 0)
        parts.push({ text: index === items.length - 1 ? joiner : ", " });
      parts.push({ text: item.text, bold: true });
    });
  };
  if (waits.length > 0) {
    parts.push({ text: Text.readsAs.locked });
    list(
      waits.map((link) => ({
        text: `${nameOf(link.from)} ${Text.readsAs.condition[link.condition as Exclude<OrderCondition, "order">]}`,
      })),
      step.waitFor === "any" ? Text.readsAs.or : Text.readsAs.and,
    );
    parts.push({ text: "." });
  }
  if (ordered.length > 0) {
    parts.push({ text: Text.readsAs.dueAfter });
    list(
      ordered.map((link) => ({ text: nameOf(link.from) })),
      Text.readsAs.and,
    );
    parts.push({ text: "." });
  }
  if (dueFrom.length > 0) {
    parts.push({ text: Text.readsAs.countsFrom });
    list(
      dueFrom.map((link) => ({ text: nameOf(link.from) })),
      Text.readsAs.and,
    );
    parts.push({ text: Text.readsAs.isDone });
  }
  if (together.length > 0) {
    parts.push({ text: Text.readsAs.together });
    list(
      together.map((rule) => ({ text: nameOf(rule.stepId) })),
      Text.readsAs.and,
    );
    parts.push({ text: "." });
  }
  if (holds.length > 0) {
    parts.push({ text: " " });
    list(
      holds.map((link) => ({ text: nameOf(link.to) })),
      Text.readsAs.and,
    );
    const condition = holds[0].condition as Exclude<OrderCondition, "order">;
    parts.push({
      text: Text.readsAs.cantStart(Text.readsAs.condition[condition]),
    });
  }
  if (waits.length > 0 && step.whenLate === "unlock")
    parts.push({ text: Text.readsAs.unlockLate });
  parts.push(
    { text: Text.readsAs.priority[step.priority] },
    {
      text: step.needsApproval
        ? Text.readsAs.approval
        : Text.readsAs.noApproval,
    },
  );
  return parts;
}

/** Steps sorted by when they're due, the earliest first; ties keep their order. */
export function byDue(steps: readonly WorkflowStep[]): WorkflowStep[] {
  return steps
    .map((step, index) => ({ step, index }))
    .sort(
      (a, b) =>
        dueOrder(a.step.due) - dueOrder(b.step.due) || a.index - b.index,
    )
    .map((entry) => entry.step);
}

/** The step a rule waits on, for the condition dropdown. */
export function ruleFirstStep(
  steps: readonly WorkflowStep[],
  step: WorkflowStep,
  rule: OrderRule,
): WorkflowStep | undefined {
  const id = firstOf(step, rule);
  return steps.find((entry) => entry.id === id);
}
