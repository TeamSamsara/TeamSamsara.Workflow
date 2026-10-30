// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/TaskForm.tsx
// Version : 1.0.0
// Latest commit: feature/tasks
// Author : Gerrah
// Purpose : A task's details as a form: title, who it's given to, when it's
// due, how to do it, tags and needs approval; with all sections, also post
// text, a checklist (ticks kept), links and asking for the published link.
// Used by New task (basics only) and Edit on the task page.

import type { ReactNode } from "react";
import type { ColouredItem, MemberRecord } from "@/core/data";
import type { PlatformSetting } from "@/features/platforms";
import {
  WorkGroupLinksEditor,
  type WorkGroupRecord,
} from "@/features/work-groups";
import {
  ChecklistEditor,
  PostTextEditor,
  ReferenceLinksText,
  SectionText,
  TagPicker,
  WorkflowLimits,
} from "@/features/workflows";
import { ButtonContent } from "@/shared/components/Button/ButtonContent";
import { buttonLook } from "@/shared/components/Button/buttonLook";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Dropdown } from "@/shared/components/Dropdown/Dropdown";
import { DropdownItem } from "@/shared/components/Dropdown/DropdownItem";
import { DropdownPanel } from "@/shared/components/Dropdown/DropdownPanel";
import { DropdownTrigger } from "@/shared/components/Dropdown/DropdownTrigger";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { HelpTip } from "@/shared/components/HelpTip/HelpTip";
import { checkTaskDraft, type TaskDraft } from "../model/taskDraft";
import { TaskLimits } from "../types/taskTypes";
import { GiveToFields } from "./GiveToFields";
import { TaskFormText as Text } from "./tasksContent";
import styles from "./TaskForm.module.css";

export interface TaskFormOptions {
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
  tags: readonly ColouredItem[];
  platforms: readonly PlatformSetting[];
}

interface TaskFormProps {
  draft: TaskDraft;
  onChange: (changes: Partial<TaskDraft>) => void;
  options: TaskFormOptions;
  showProblems: boolean;
  /** Show the sections (post text, checklist, links, published link). */
  withSections?: boolean;
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
  onRemove: () => void;
  children?: ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={name}>
      <header className={styles.sectionHeader}>
        <span className={styles.sectionHeading}>
          <h3 className={styles.sectionTitle}>{name}</h3>
          <HelpTip topic={name}>{help}</HelpTip>
        </span>
        <IconButton
          icon="close"
          label={Text.removeSection(name)}
          variant="ghost"
          size="small"
          onClick={onRemove}
        />
      </header>
      {children}
    </section>
  );
}

export function TaskForm({
  draft,
  onChange,
  options,
  showProblems,
  withSections = false,
}: TaskFormProps) {
  const has: Record<SectionKey, boolean> = {
    posts: draft.posts !== null,
    checklist: draft.checklist !== null,
    links: draft.links !== null,
    liveLink: draft.asksForLiveLink,
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
    <div className={styles.form}>
      <TextField
        label={Text.title}
        placeholder={Text.titlePlaceholder}
        value={draft.title}
        maxLength={TaskLimits.title}
        onChange={(event) => onChange({ title: event.target.value })}
        error={showProblems ? checkTaskDraft(draft) : undefined}
        autoFocus
      />
      <GiveToFields
        value={{ workGroupId: draft.workGroupId, memberId: draft.memberId }}
        onChange={onChange}
        groups={options.groups}
        members={options.members}
      />
      <div className={styles.pair}>
        <TextField
          label={Text.dueDate}
          help={Text.dueHelp}
          type="date"
          value={draft.dueDate}
          onChange={(event) => onChange({ dueDate: event.target.value })}
        />
        <TextField
          label={Text.dueTime}
          type="time"
          value={draft.dueTime}
          onChange={(event) => onChange({ dueTime: event.target.value })}
          disabled={!draft.dueDate}
          placeholder={Text.noTime}
        />
      </div>
      <TextArea
        label={Text.notes}
        placeholder={Text.notesPlaceholder}
        value={draft.notes}
        rows={3}
        maxLength={TaskLimits.notes}
        onChange={(event) => onChange({ notes: event.target.value })}
      />
      <TagPicker
        tagIds={draft.tagIds}
        tags={options.tags}
        onChange={(tagIds) => onChange({ tagIds })}
      />

      {withSections && draft.posts !== null ? (
        <Section
          name={SectionText.posts.name}
          help={SectionText.posts.help}
          onRemove={() => onChange({ posts: null })}
        >
          <PostTextEditor
            posts={draft.posts}
            onChange={(posts) => onChange({ posts })}
            settings={options.platforms}
          />
        </Section>
      ) : null}
      {withSections && draft.checklist !== null ? (
        <Section
          name={SectionText.checklist.name}
          help={SectionText.checklist.help}
          onRemove={() => onChange({ checklist: null })}
        >
          <ChecklistEditor
            items={draft.checklist.map(({ id, text }) => ({ id, text }))}
            onChange={(items) =>
              onChange({
                checklist: items.map((item) => ({
                  ...item,
                  done:
                    draft.checklist?.find((old) => old.id === item.id)?.done ??
                    false,
                })),
              })
            }
          />
        </Section>
      ) : null}
      {withSections && draft.links !== null ? (
        <Section
          name={SectionText.links.name}
          help={SectionText.links.help}
          onRemove={() => onChange({ links: null })}
        >
          <WorkGroupLinksEditor
            links={draft.links}
            errors={[]}
            onChange={(links) => onChange({ links })}
            showErrors={false}
            text={ReferenceLinksText}
            max={WorkflowLimits.links}
          />
        </Section>
      ) : null}
      {withSections && draft.asksForLiveLink ? (
        <Section
          name={SectionText.liveLink.name}
          help={SectionText.liveLink.help}
          onRemove={() => onChange({ asksForLiveLink: false })}
        />
      ) : null}
      {withSections && missing.length > 0 ? (
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
        checked={draft.needsApproval}
        onChange={(event) => onChange({ needsApproval: event.target.checked })}
      />
    </div>
  );
}
