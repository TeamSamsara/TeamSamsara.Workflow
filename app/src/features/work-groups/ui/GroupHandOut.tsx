// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/GroupHandOut.tsx
// Version : 1.0.0
// Latest commit: feature/auto-assign
// Author : Gerrah
// Purpose : A group's hand-out panel: the switch to hand out its tasks
// automatically, how it picks someone, the daily limit and the leads'
// heads-up (for people who manage work groups), and who takes tasks (also
// the group's leads', for themselves and anyone at their rank or below).
// Each change saves straight away through the server.

import { decide } from "@engine/access/index";
import { AssignLimits } from "@engine/assign";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { manageRefusal, useActor } from "@/core/access";
import { dataErrorMessage, type MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import { Select } from "@/shared/components/Fields/Select/Select";
import { Switch } from "@/shared/components/Fields/Switch/Switch";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { useToast } from "@/shared/components/Toast/useToast";
import { changeHandOut, type HandOutChange } from "../service/workGroupService";
import type { WorkGroupRecord } from "../types/workGroupTypes";
import { GroupHandOutText as Text } from "./groupHandOutContent";
import styles from "./GroupHandOut.module.css";

interface GroupHandOutProps {
  group: WorkGroupRecord;
  /** The group's current members. */
  members: readonly MemberRecord[];
  /** Someone's open tasks in the next 7 days, when the page knows them. */
  loadOf?: (memberId: string) => number;
}

export function GroupHandOut({ group, members, loadOf }: GroupHandOutProps) {
  const actor = useActor();
  const toast = useToast();
  const settings = group.assign;
  const { dailyLimit, headsUpHours } = AssignLimits;
  // What's typed in the limit until it's saved; otherwise the saved limit.
  const [typed, setTyped] = useState<string | null>(null);
  const limit = typed ?? String(settings.dailyLimit);

  const save = useMutation({
    mutationFn: (change: HandOutChange) => changeHandOut(group.id, change),
    onError: (error) => {
      const reason = manageRefusal(error);
      toast.show({
        tone: "error",
        title: Text.failed,
        detail: (reason && Text.refusals[reason]) || dataErrorMessage(error),
      });
    },
  });

  if (!actor) return null;
  const canSettings = decide(actor, { action: "group.settings" }).ok;
  const canChoose = (member: MemberRecord) =>
    decide(actor, {
      action: "group.setTakesTasks",
      groupId: group.id,
      memberId: member.id,
      memberRank: member.rank,
    }).ok;
  const leads = actor.leadOf.includes(group.id);
  if (!canSettings && !leads) return null;

  const busy = save.isPending;
  const commitLimit = () => {
    const value = Number(limit);
    setTyped(null);
    if (
      Number.isInteger(value) &&
      value >= dailyLimit.min &&
      value <= dailyLimit.max &&
      value !== settings.dailyLimit
    )
      save.mutate({ dailyLimit: value });
  };
  const setTakes = (memberId: string, takes: boolean) =>
    save.mutate({
      skip: takes
        ? settings.skip.filter((id) => id !== memberId)
        : [...settings.skip, memberId],
    });
  const people = [...members].sort(
    (a, b) =>
      Number(group.leadIds.includes(b.id)) -
        Number(group.leadIds.includes(a.id)) ||
      memberName(a).localeCompare(memberName(b)),
  );

  return (
    <div className={styles.panel}>
      <Switch
        label={Text.title}
        description={settings.on ? Text.on(group.name) : Text.off(group.name)}
        checked={settings.on}
        onCheckedChange={(on) => save.mutate({ on })}
        disabled={!canSettings || busy}
      />

      <div className={styles.rules} data-off={!settings.on || undefined}>
        <h4 className={styles.subheading}>{Text.rulesTitle(group.name)}</h4>
        <ol className={styles.steps}>
          {Text.rules.map((rule, index) => (
            <li key={rule.lead} className={styles.step}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <span>
                <b>{rule.lead}</b>
                {rule.rest}
              </span>
            </li>
          ))}
        </ol>
        <p className={styles.muted}>{Text.reach}</p>
        <div className={styles.fields}>
          <TextField
            label={Text.limitLabel}
            type="number"
            inputMode="numeric"
            min={dailyLimit.min}
            max={dailyLimit.max}
            value={limit}
            onChange={(event) => setTyped(event.target.value)}
            onBlur={commitLimit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitLimit();
            }}
            hint={Text.limitHint(dailyLimit.min, dailyLimit.max)}
            disabled={!canSettings || busy}
          />
          <Select
            label={Text.headsUpLabel}
            options={headsUpHours.choices.map((hours) => ({
              value: String(hours),
              label: Text.headsUp(hours),
            }))}
            value={String(settings.headsUpHours)}
            onChange={(event) =>
              save.mutate({ headsUpHours: Number(event.target.value) })
            }
            disabled={!canSettings || busy}
          />
        </div>
      </div>

      <div className={styles.takers}>
        <h4 className={styles.subheading}>{Text.takersTitle}</h4>
        {people.length === 0 ? (
          <p className={styles.muted}>{Text.noMembers}</p>
        ) : (
          <ul className={styles.list}>
            {people.map((member) => {
              const name = memberName(member);
              const allowed = canChoose(member);
              const meta = [
                group.leadIds.includes(member.id) ? Text.lead : Text.member,
                ...(loadOf ? [Text.load(loadOf(member.id))] : []),
                ...(allowed ? [] : [Text.lockedRank]),
              ].join(" · ");
              return (
                <li key={member.id}>
                  <Switch
                    label={name}
                    description={meta}
                    checked={!settings.skip.includes(member.id)}
                    onCheckedChange={(takes) => setTakes(member.id, takes)}
                    disabled={!allowed || busy}
                  />
                </li>
              );
            })}
          </ul>
        )}
        <p className={styles.muted}>{Text.takersHint}</p>
      </div>
    </div>
  );
}
