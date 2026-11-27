// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/ExtrasList.tsx
// Version : 1.0.0
// Latest commit: feature/1.2-order-rules
// Author : Gerrah
// Purpose : Everything a step can carry, always listed: post text, a
// checklist, reference links, asking for the live link, and tags. Each row
// says what it holds, with Add or Edit; Edit opens its editor in place, and
// Remove takes it off the step.

import { useState, type ReactNode } from "react";
import { WorkGroupLinksEditor } from "@/features/work-groups";
import { findPlatform } from "@/features/platforms";
import { Button } from "@/shared/components/Button/Button";
import type { StepProblems } from "../model/workflowChecks";
import { WorkflowLimits, type WorkflowStep } from "../types/workflowTypes";
import { ChecklistEditor } from "./ChecklistEditor";
import { PostTextEditor } from "./PostTextEditor";
import type { StepEditorOptions } from "./StepEditor";
import { TagPicker } from "./TagPicker";
import {
  ExtrasText as Text,
  ReferenceLinksText,
  SectionText,
} from "./workflowsContent";
import styles from "./ExtrasList.module.css";

type ExtraKey = "posts" | "checklist" | "links" | "liveLink" | "tags";

interface ExtrasListProps {
  step: WorkflowStep;
  onChange: (changes: Partial<Omit<WorkflowStep, "id">>) => void;
  options: StepEditorOptions;
  problems: StepProblems | undefined;
  showProblems: boolean;
  readOnly?: boolean;
}

export function ExtrasList({
  step,
  onChange,
  options,
  problems,
  showProblems,
  readOnly = false,
}: ExtrasListProps) {
  const linkProblem = showProblems && (problems?.links ?? []).some(Boolean);
  const [open, setOpen] = useState<Set<ExtraKey>>(
    () => new Set(linkProblem ? ["links"] : []),
  );
  const isOpen = (key: ExtraKey) =>
    open.has(key) || (key === "links" && linkProblem);
  const toggle = (key: ExtraKey, to?: boolean) =>
    setOpen((current) => {
      const next = new Set(current);
      if (to ?? !next.has(key)) next.add(key);
      else next.delete(key);
      return next;
    });

  const platformNames = (step.posts ?? [])
    .map((post) => findPlatform(post.platformId)?.name)
    .filter(Boolean)
    .join(", ");
  const tagNames = options.tags
    .filter((tag) => step.tagIds.includes(tag.id))
    .map((tag) => tag.name)
    .join(", ");

  const rows: {
    key: ExtraKey;
    name: string;
    has: boolean;
    summary: string;
    add: () => void;
    remove: () => void;
    editor: ReactNode;
  }[] = [
    {
      key: "posts",
      name: SectionText.posts.name,
      has: step.posts !== null,
      summary: platformNames || Text.noPlatforms,
      add: () => onChange({ posts: [] }),
      remove: () => onChange({ posts: null }),
      editor: (
        <PostTextEditor
          posts={step.posts ?? []}
          onChange={(posts) => onChange({ posts })}
          settings={options.platforms}
        />
      ),
    },
    {
      key: "checklist",
      name: SectionText.checklist.name,
      has: step.checklist !== null,
      summary: Text.items(step.checklist?.length ?? 0),
      add: () => onChange({ checklist: [] }),
      remove: () => onChange({ checklist: null }),
      editor: (
        <ChecklistEditor
          items={step.checklist ?? []}
          onChange={(checklist) => onChange({ checklist })}
        />
      ),
    },
    {
      key: "links",
      name: SectionText.links.name,
      has: step.links !== null,
      summary: Text.links(step.links?.length ?? 0),
      add: () => onChange({ links: [] }),
      remove: () => onChange({ links: null }),
      editor: (
        <WorkGroupLinksEditor
          links={step.links ?? []}
          errors={problems?.links ?? []}
          onChange={(links) => onChange({ links })}
          showErrors={showProblems}
          text={ReferenceLinksText}
          max={WorkflowLimits.links}
        />
      ),
    },
    {
      key: "liveLink",
      name: SectionText.liveLink.name,
      has: step.asksForLiveLink,
      summary: step.asksForLiveLink ? Text.liveLinkOn : Text.off,
      add: () => onChange({ asksForLiveLink: true }),
      remove: () => onChange({ asksForLiveLink: false }),
      editor: <p className={styles.note}>{SectionText.liveLink.help}</p>,
    },
    {
      key: "tags",
      name: Text.tags,
      has: step.tagIds.length > 0,
      summary: tagNames || Text.noTags,
      add: () => undefined,
      remove: () => onChange({ tagIds: [] }),
      editor: (
        <TagPicker
          tagIds={step.tagIds}
          tags={options.tags}
          onChange={(tagIds) => onChange({ tagIds })}
          readOnly={readOnly}
        />
      ),
    },
  ];

  return (
    <ul className={styles.list} aria-label={Text.label}>
      {rows.map((row) => {
        const expanded = isOpen(row.key);
        const panelId = `extra-${step.id}-${row.key}`;
        return (
          <li key={row.key} className={styles.item}>
            <div className={styles.row}>
              <div className={styles.text}>
                <b className={styles.name}>{row.name}</b>
                <span className={styles.summary}>
                  {row.has ? row.summary : Text.noneYet}
                </span>
              </div>
              {readOnly && !row.has ? null : (
                <Button
                  size="small"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => {
                    if (expanded) return toggle(row.key, false);
                    if (!row.has) row.add();
                    toggle(row.key, true);
                  }}
                >
                  {expanded ? Text.close : row.has ? Text.edit : Text.add}
                </Button>
              )}
            </div>
            {expanded ? (
              <div id={panelId} className={styles.panel}>
                {row.editor}
                {readOnly || !row.has ? null : (
                  <Button
                    size="small"
                    variant="ghost"
                    iconStart="trash"
                    className={styles.remove}
                    onClick={() => {
                      row.remove();
                      toggle(row.key, false);
                    }}
                  >
                    {Text.remove(row.name)}
                  </Button>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
