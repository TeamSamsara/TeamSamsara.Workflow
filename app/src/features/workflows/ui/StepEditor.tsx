// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/StepEditor.tsx
// Version : 2.0.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : One step of a workflow, open for editing, in six parts that always
// come in the same order: What (title, how to do it), Who (given to, who in
// the group), When (due), Order (its order rules), Priority and approval, and
// Extras (post text, checklist, links, live link, tags). Every choice is the
// same kind of dropdown.

import { decide } from "@engine/access/index";
import type { ReactNode } from "react";
import { useActor } from "@/core/access";
import type { ColouredItem, MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import type { PlatformSetting } from "@/features/platforms";
import type { WorkGroupRecord } from "@/features/work-groups";
import { Button } from "@/shared/components/Button/Button";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import type { ClockFormat } from "@/shared/time/dates";
import { giveToValue, parseGiveTo } from "../model/giveTo";
import type { StepProblems } from "../model/workflowChecks";
import {
  WorkflowLimits,
  type Priority,
  type WorkflowStep,
} from "../types/workflowTypes";
import { DueOffsetField } from "./DueOffsetField";
import { ExtrasList } from "./ExtrasList";
import { byMemberName, giveToOptions } from "./giveToOptions";
import { OrderRulesField } from "./OrderRulesField";
import { StepEditorText as Text } from "./workflowsContent";
import styles from "./StepEditor.module.css";

/** What the editor offers to choose from. */
export interface StepEditorOptions {
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
  tags: readonly ColouredItem[];
  platforms: readonly PlatformSetting[];
  clockFormat: ClockFormat;
}

interface StepEditorProps {
  /** Every step, numbered the way the list shows them (in due order). */
  steps: readonly WorkflowStep[];
  step: WorkflowStep;
  onChange: (changes: Partial<Omit<WorkflowStep, "id">>) => void;
  problems: StepProblems | undefined;
  /** Show the problems (once the person has tried to save). */
  showProblems: boolean;
  options: StepEditorOptions;
  onDuplicate: () => void;
  canDuplicate: boolean;
  onRemove: () => void;
  /** Shown to read, without the buttons that change it. */
  readOnly?: boolean;
}

function Part({
  number,
  name,
  children,
}: {
  number: number;
  name: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.part} aria-label={name}>
      <h3 className={styles.partHeading}>
        <span className={styles.partNumber} aria-hidden>
          {number}
        </span>
        <span className={styles.partName}>{name}</span>
      </h3>
      {children}
    </section>
  );
}

export function StepEditor({
  steps,
  step,
  onChange,
  problems,
  showProblems,
  options,
  onDuplicate,
  canDuplicate,
  onRemove,
  readOnly = false,
}: StepEditorProps) {
  const actor = useActor();
  // A workflow names only people at or below the editor (the one it names
  // now stays shown, so the step reads as saved).
  const canName = (member: MemberRecord) =>
    member.id === step.memberId ||
    !actor ||
    decide(actor, { action: "workflow.namePerson", personRank: member.rank })
      .ok;
  const group = options.groups.find((entry) => entry.id === step.workGroupId);
  const named = options.members.find((entry) => entry.id === step.memberId);
  const giveToChoices = giveToOptions(options.groups, options.members, canName);
  const inGroup = group
    ? options.members
        .filter(
          (member) =>
            member.workGroupIds.includes(group.id) ||
            member.id === step.memberId,
        )
        .sort(byMemberName)
    : [];
  const number = steps.findIndex((entry) => entry.id === step.id) + 1;

  return (
    <div className={styles.editor}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {number > 0 ? `${number}. ` : ""}
          {step.title.trim() || Text.untitled}
        </h2>
        <p className={styles.muted}>{Text.everyPart}</p>
      </header>

      <Part number={1} name={Text.parts.what}>
        <TextField
          label={Text.title}
          placeholder={Text.titlePlaceholder}
          value={step.title}
          maxLength={WorkflowLimits.title}
          onChange={(event) => onChange({ title: event.target.value })}
          error={showProblems ? problems?.title : undefined}
        />
        <TextArea
          label={Text.notes}
          placeholder={Text.notesPlaceholder}
          value={step.notes}
          rows={3}
          maxLength={WorkflowLimits.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          error={showProblems ? problems?.notes : undefined}
        />
      </Part>

      <Part number={2} name={Text.parts.who}>
        <div className={styles.pair}>
          <Select
            label={Text.giveTo}
            help={Text.giveToHelp}
            options={giveToChoices}
            value={giveToValue(step)}
            onChange={(event) => onChange(parseGiveTo(event.target.value))}
          />
          {group ? (
            <Select
              label={Text.whoInGroup(group.name)}
              options={[
                {
                  value: "",
                  label: group.assign.on
                    ? Text.leastBusy
                    : Text.anyoneInGroup(group.name),
                },
                ...inGroup.map((member) => ({
                  value: member.id,
                  label: !canName(member)
                    ? Text.aboveRank(memberName(member))
                    : group.leadIds.includes(member.id)
                      ? Text.lead(memberName(member))
                      : memberName(member),
                  disabled: !canName(member),
                })),
              ]}
              value={step.memberId ?? ""}
              onChange={(event) =>
                onChange({ memberId: event.target.value || null })
              }
            />
          ) : null}
        </div>
        {group ? (
          <p className={styles.muted}>
            {named
              ? Text.whoNamed(memberName(named), group.name)
              : group.assign.on
                ? Text.whoHandedOut(group.name)
                : Text.whoAnyone(group.name)}
          </p>
        ) : null}
      </Part>

      <Part number={3} name={Text.parts.when}>
        <DueOffsetField
          label={Text.due}
          help={Text.dueHelp}
          value={step.due}
          onChange={(due) => onChange({ due })}
          clockFormat={options.clockFormat}
        />
      </Part>

      <Part number={4} name={Text.parts.order}>
        <OrderRulesField
          steps={steps}
          step={step}
          onChange={onChange}
          problems={problems?.order ?? []}
          readOnly={readOnly}
        />
      </Part>

      <Part number={5} name={Text.parts.priority}>
        <div className={styles.pair}>
          <Select
            label={Text.priority}
            options={[
              { value: "high", label: Text.priorities.high },
              { value: "normal", label: Text.priorities.normal },
              { value: "low", label: Text.priorities.low },
            ]}
            value={step.priority}
            onChange={(event) =>
              onChange({ priority: event.target.value as Priority })
            }
            hint={Text.priorityHint}
          />
          <Select
            label={Text.approval}
            help={Text.needsApprovalHelp}
            options={[
              { value: "no", label: Text.noApproval },
              { value: "yes", label: Text.needsApproval },
            ]}
            value={step.needsApproval ? "yes" : "no"}
            onChange={(event) =>
              onChange({ needsApproval: event.target.value === "yes" })
            }
          />
        </div>
      </Part>

      <Part number={6} name={Text.parts.extras}>
        <p className={styles.muted}>{Text.extrasHelp}</p>
        <ExtrasList
          step={step}
          onChange={onChange}
          options={options}
          problems={problems}
          showProblems={showProblems}
          readOnly={readOnly}
        />
      </Part>

      {readOnly ? null : (
        <footer className={styles.footer}>
          <Button
            size="small"
            iconStart="copy"
            onClick={onDuplicate}
            disabled={!canDuplicate}
          >
            {Text.duplicate}
          </Button>
          <Button
            size="small"
            variant="danger"
            iconStart="trash"
            onClick={onRemove}
          >
            {Text.remove}
          </Button>
        </footer>
      )}
    </div>
  );
}
