// File : /TeamSamsara.Workflow/app/src/features/workflows/model/importExport.ts
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : A workflow as a JSON file and back, to keep a copy or move one to
// another workspace. An import is read as carefully as a stored workflow, and
// anything that points at this workspace's groups, people, tags, event types
// or platforms is dropped when it doesn't exist here.

import {
  readSteps,
  WorkflowLimits,
  type WorkflowFields,
  type WorkflowRecord,
} from "../types/workflowTypes";
import { ImportText } from "./importExportContent";
import { localId } from "./localId";

const fileKind = "teamsamsara-workflow";
const fileVersion = 1;

export function exportWorkflow(workflow: WorkflowRecord): string {
  return JSON.stringify(
    {
      kind: fileKind,
      version: fileVersion,
      exportedAt: new Date().toISOString(),
      workflow: {
        name: workflow.name,
        description: workflow.description,
        eventTypeId: workflow.eventTypeId,
        steps: workflow.steps,
      },
    },
    null,
    2,
  );
}

/** A file name from the workflow's name: "livestream.workflow.json". */
export function exportFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "workflow"}.workflow.json`;
}

/** What exists in this workspace, to check an import's references against. */
export interface ImportContext {
  workGroupIds: readonly string[];
  memberIds: readonly string[];
  tagIds: readonly string[];
  eventTypeIds: readonly string[];
  platformIds: readonly string[];
  /** Names already used, so an import with the same name becomes a copy. */
  workflowNames: readonly string[];
}

export type ImportResult =
  | { ok: true; fields: WorkflowFields; dropped: number }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueName(name: string, taken: readonly string[]): string {
  const used = new Set(taken.map((entry) => entry.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  for (let copy = 1; ; copy += 1) {
    const candidate = copy === 1 ? `${name} (copy)` : `${name} (copy ${copy})`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

export function importWorkflow(
  text: string,
  context: ImportContext,
): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: ImportText.notJson };
  }
  if (!isObject(parsed) || parsed.kind !== fileKind) {
    return { ok: false, error: ImportText.notWorkflow };
  }
  if (typeof parsed.version !== "number" || parsed.version > fileVersion) {
    return { ok: false, error: ImportText.newerVersion };
  }
  const workflow = parsed.workflow;
  if (!isObject(workflow) || typeof workflow.name !== "string") {
    return { ok: false, error: ImportText.notWorkflow };
  }

  let dropped = 0;
  const keep = (id: string | null, known: readonly string[]) => {
    if (id === null || known.includes(id)) return id;
    dropped += 1;
    return null;
  };

  const steps = readSteps(workflow)
    .slice(0, WorkflowLimits.steps)
    .map((step) => {
      const tagIds = step.tagIds.filter((id) => context.tagIds.includes(id));
      const posts =
        step.posts?.filter((post) =>
          context.platformIds.includes(post.platformId),
        ) ?? null;
      dropped +=
        step.tagIds.length -
        tagIds.length +
        (step.posts?.length ?? 0) -
        (posts?.length ?? 0);
      return {
        ...step,
        // New ids, so an import never shares ids with the workflow it came from.
        id: localId(),
        workGroupId: keep(step.workGroupId, context.workGroupIds),
        memberId: keep(step.memberId, context.memberIds),
        tagIds,
        posts,
        checklist:
          step.checklist
            ?.slice(0, WorkflowLimits.checklistItems)
            .map((item) => ({ ...item, id: localId() })) ?? null,
        links: step.links?.slice(0, WorkflowLimits.links) ?? null,
      };
    });

  const eventTypeId = keep(
    typeof workflow.eventTypeId === "string" ? workflow.eventTypeId : null,
    context.eventTypeIds,
  );
  const name = workflow.name.trim().slice(0, 80) || ImportText.untitled;

  return {
    ok: true,
    dropped,
    fields: {
      name: uniqueName(name, context.workflowNames),
      description:
        typeof workflow.description === "string"
          ? workflow.description.slice(0, WorkflowLimits.description)
          : "",
      eventTypeId,
      steps,
    },
  };
}
