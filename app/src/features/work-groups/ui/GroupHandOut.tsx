// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/GroupHandOut.tsx
// Version : 2.0.0
// Latest commit: feature/1.2-workload
// Author : Gerrah
// Purpose : A group's hand-out panel: the switch to hand out its tasks
// automatically, how it picks someone and the leads' heads-up (for people who
// manage work groups), the group's usual week (Owners and Administrators),
// and who takes tasks, each with their week in a word (also the group's
// leads', for themselves and anyone at their rank or below).
// Each change saves straight away through the server.

import { decide, type Actor } from "@engine/access/index";
import { AssignLimits } from "@engine/assign";
import type { WeekState } from "@engine/workload";
import { useMutation } from "@tanstack/react-query";
import { manageRefusal, useActor } from "@/core/access";
import { dataErrorMessage, type MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import { WeekStateText, WorkloadText } from "@/features/workload";
import { Select } from "@/shared/components/Fields/Select/Select";
import { Switch } from "@/shared/components/Fields/Switch/Switch";
import { useToast } from "@/shared/components/Toast/useToast";
import { changeHandOut, type HandOutChange } from "../service/workGroupService";
import type { WorkGroupRecord } from "../types/workGroupTypes";
import { GroupHandOutText as Text } from "./groupHandOutContent";
import styles from "./GroupHandOut.module.css";

interface GroupHandOutProps {
  group: WorkGroupRecord;
  /** The group's current members. */
  members: readonly MemberRecord[];
  /** Someone's week in a word, when the page knows their tasks. */
  weekOf?: (memberId: string) => WeekState | null;
}

export function GroupHandOut(props: GroupHandOutProps) {
  const actor = useActor();
  const toast = useToast();
  const save = useMutation({
    mutationFn: (change: HandOutChange) =>
      changeHandOut(props.group.id, change),
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
  return (
    <GroupHandOutPanel
      {...props}
      actor={actor}
      busy={save.isPending}
      onChange={(change) => save.mutate(change)}
    />
  );
}

interface PanelProps extends GroupHandOutProps {
  actor: Actor;
  busy: boolean;
  onChange: (change: HandOutChange) => void;
}

/** The panel itself, as the signed-in person may change it. */
export function GroupHandOutPanel({
  group,
  members,
  weekOf,
  actor,
  busy,
  onChange,
}: PanelProps) {
  const settings = group.assign;
  const { headsUpHours } = AssignLimits;

  const canSettings = decide(actor, { action: "group.settings" }).ok;
  const canWeek = decide(actor, { action: "workload.set" }).ok;
  const canChoose = (member: MemberRecord) =>
    decide(actor, {
      action: "group.setTakesTasks",
      groupId: group.id,
      memberId: member.id,
      memberRank: member.rank,
    }).ok;
  const leads = actor.leadOf.includes(group.id);
  if (!canSettings && !leads) return null;

  const weekChoices = [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100];
  if (group.usualWeek !== null && !weekChoices.includes(group.usualWeek))
    weekChoices.push(group.usualWeek);
  const setTakes = (memberId: string, takes: boolean) =>
    onChange({
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
        onCheckedChange={(on) => onChange({ on })}
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
        {canSettings ? null : <p className={styles.muted}>{Text.leadsCant}</p>}
        <div className={styles.fields}>
          <Select
            label={Text.headsUpLabel}
            options={headsUpHours.choices.map((hours) => ({
              value: String(hours),
              label: Text.headsUp(hours),
            }))}
            value={String(settings.headsUpHours)}
            onChange={(event) =>
              onChange({ headsUpHours: Number(event.target.value) })
            }
            disabled={!canSettings || busy}
          />
        </div>
      </div>

      {/* Used for the planning warnings whether or not it hands out tasks. */}
      <div className={styles.fields}>
        <Select
          label={WorkloadText.groupTitle(group.name)}
          help={WorkloadText.groupHelp(group.name)}
          options={[
            { value: "", label: WorkloadText.noGroupWeek },
            ...[...weekChoices]
              .sort((a, b) => a - b)
              .map((value) => ({
                value: String(value),
                label: WorkloadText.usualWeek(value),
              })),
          ]}
          value={group.usualWeek === null ? "" : String(group.usualWeek)}
          onChange={(event) =>
            onChange({
              usualWeek: event.target.value ? Number(event.target.value) : null,
            })
          }
          hint={canWeek ? undefined : WorkloadText.adminsOnly}
          disabled={!canWeek || busy}
        />
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
                ...(weekOf?.(member.id)
                  ? [WeekStateText[weekOf(member.id) as WeekState].label]
                  : []),
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
