// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/StepEditor.tsx
// Version : 1.2.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : One task of a workflow, open for editing: the basics every task
// has (title, who it's given to, when it's due, how to do it, tags, needs
// approval), then the sections it adds: post text, checklist, reference links,
// and asking for the link to what was published.

import type { ReactNode } from "react";
import type { ColouredItem, MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import type { PlatformSetting } from "@/features/platforms";
import {
  WorkGroupLinksEditor,
  type WorkGroupRecord,
} from "@/features/work-groups";
import { Button } from "@/shared/components/Button/Button";
import { ButtonContent } from "@/shared/components/Button/ButtonContent";
import { buttonLook } from "@/shared/components/Button/buttonLook";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Dropdown } from "@/shared/components/Dropdown/Dropdown";
import { HelpTip } from "@/shared/components/HelpTip/HelpTip";
import { DropdownItem } from "@/shared/components/Dropdown/DropdownItem";
import { DropdownPanel } from "@/shared/components/Dropdown/DropdownPanel";
import { DropdownTrigger } from "@/shared/components/Dropdown/DropdownTrigger";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import type { ClockFormat } from "@/shared/time/dates";
import type { StepProblems } from "../model/workflowChecks";
import { WorkflowLimits, type WorkflowStep } from "../types/workflowTypes";
import { giveToValue, parseGiveTo } from "../model/giveTo";
import { ChecklistEditor } from "./ChecklistEditor";
import { DueOffsetField } from "./DueOffsetField";
import { byMemberName, giveToOptions } from "./giveToOptions";
import { PostTextEditor } from "./PostTextEditor";
import { TagPicker } from "./TagPicker";
import {
  ReferenceLinksText,
  SectionText,
  StepEditorText as Text,
} from "./workflowsContent";
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

type SectionKey = keyof typeof SectionText;

function Section({
  name,
  help,
  onRemove,
  children,
}: {
  name: string;
  help: string;
  /** Null when it can't be removed. */
  onRemove: (() => void) | null;
  children?: ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={name}>
      <header className={styles.sectionHeader}>
        <div className={styles.sectionHeading}>
          <h4 className={styles.sectionTitle}>{name}</h4>
          <HelpTip topic={name}>{help}</HelpTip>
        </div>
        {onRemove ? (
          <IconButton
            icon="close"
            label={Text.removeSection(name)}
            variant="ghost"
            size="small"
            onClick={onRemove}
          />
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function StepEditor({
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
  const removable = (remove: () => void) => (readOnly ? null : remove);
  const group = options.groups.find((entry) => entry.id === step.workGroupId);
  const giveToChoices = giveToOptions(options.groups, options.members);
  const inGroup = group
    ? options.members
        .filter(
          (member) =>
            member.workGroupIds.includes(group.id) ||
            member.id === step.memberId,
        )
        .sort(byMemberName)
    : [];

  const has: Record<SectionKey, boolean> = {
    posts: step.posts !== null,
    checklist: step.checklist !== null,
    links: step.links !== null,
    liveLink: step.asksForLiveLink,
  };
  const missing = (Object.keys(SectionText) as SectionKey[]).filter(
    (key) => !has[key],
  );

  function addSection(key: SectionKey) {
    if (key === "posts") onChange({ posts: [] });
    if (key === "checklist") onChange({ checklist: [] });
    if (key === "links") onChange({ links: [] });
    if (key === "liveLink") onChange({ asksForLiveLink: true });
  }

  return (
    <div className={styles.editor}>
      <TextField
        label={Text.title}
        placeholder={Text.titlePlaceholder}
        value={step.title}
        maxLength={WorkflowLimits.title}
        onChange={(event) => onChange({ title: event.target.value })}
        error={showProblems ? problems?.title : undefined}
      />

      <div className={styles.assign}>
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
              { value: "", label: Text.anyoneInGroup(group.name) },
              ...inGroup.map((member) => ({
                value: member.id,
                label: memberName(member),
              })),
            ]}
            value={step.memberId ?? ""}
            onChange={(event) =>
              onChange({ memberId: event.target.value || null })
            }
          />
        ) : null}
      </div>

      <DueOffsetField
        label={Text.due}
        help={Text.dueHelp}
        value={step.due}
        onChange={(due) => onChange({ due })}
        clockFormat={options.clockFormat}
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

      <TagPicker
        tagIds={step.tagIds}
        tags={options.tags}
        onChange={(tagIds) => onChange({ tagIds })}
        readOnly={readOnly}
      />

      {step.posts !== null ? (
        <Section
          name={SectionText.posts.name}
          help={SectionText.posts.help}
          onRemove={removable(() => onChange({ posts: null }))}
        >
          <PostTextEditor
            posts={step.posts}
            onChange={(posts) => onChange({ posts })}
            settings={options.platforms}
          />
        </Section>
      ) : null}

      {step.checklist !== null ? (
        <Section
          name={SectionText.checklist.name}
          help={SectionText.checklist.help}
          onRemove={removable(() => onChange({ checklist: null }))}
        >
          <ChecklistEditor
            items={step.checklist}
            onChange={(checklist) => onChange({ checklist })}
          />
        </Section>
      ) : null}

      {step.links !== null ? (
        <Section
          name={SectionText.links.name}
          help={SectionText.links.help}
          onRemove={removable(() => onChange({ links: null }))}
        >
          <WorkGroupLinksEditor
            links={step.links}
            errors={problems?.links ?? []}
            onChange={(links) => onChange({ links })}
            showErrors={showProblems}
            text={ReferenceLinksText}
            max={WorkflowLimits.links}
          />
        </Section>
      ) : null}

      {step.asksForLiveLink ? (
        <Section
          name={SectionText.liveLink.name}
          help={SectionText.liveLink.help}
          onRemove={removable(() => onChange({ asksForLiveLink: false }))}
        />
      ) : null}

      {missing.length > 0 && !readOnly ? (
        <Dropdown className={styles.addSection}>
          <DropdownTrigger
            popup="menu"
            {...buttonLook("secondary", "small", false)}
          >
            <ButtonContent iconStart="add">{Text.addSection}</ButtonContent>
          </DropdownTrigger>
          <DropdownPanel role="menu" aria-label={Text.addSection}>
            {missing.map((key) => (
              <DropdownItem
                key={key}
                role="menuitem"
                onSelect={() => addSection(key)}
                className={styles.sectionItem}
              >
                <b>{SectionText[key].name}</b>
                <span className={styles.muted}>
                  {SectionText[key].description}
                </span>
              </DropdownItem>
            ))}
          </DropdownPanel>
        </Dropdown>
      ) : null}

      <Checkbox
        label={Text.needsApproval}
        help={Text.needsApprovalHelp}
        checked={step.needsApproval}
        onChange={(event) => onChange({ needsApproval: event.target.checked })}
      />

      {readOnly ? null : (
        <footer className={styles.footer}>
          <Button
            variant="ghost"
            size="small"
            iconStart="copy"
            onClick={onDuplicate}
            disabled={!canDuplicate}
          >
            {Text.duplicate}
          </Button>
          <Button
            variant="ghost"
            size="small"
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
