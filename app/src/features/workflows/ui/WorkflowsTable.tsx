// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/WorkflowsTable.tsx
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : The workflows as a table: name, what it's for, how many tasks,
// which work groups they're given to, and when it last changed.

import { Link } from "react-router-dom";
import type { WorkGroupRecord } from "@/features/work-groups";
import { Chip } from "@/shared/components/Chip/Chip";
import { Table } from "@/shared/components/Table/Table";
import { Icon } from "@/shared/icons/Icon";
import { formatRecentDay } from "@/shared/time/dates";
import type { WorkflowRecord } from "../types/workflowTypes";
import { WorkflowsTableText as Text } from "./workflowsContent";
import styles from "./WorkflowsTable.module.css";

interface WorkflowsTableProps {
  workflows: readonly WorkflowRecord[];
  groups: readonly WorkGroupRecord[];
  hrefFor: (workflowId: string) => string;
  timeZone: string;
}

const tableMinWidth = 760;

/** The groups a workflow's tasks go to, each once, by name. */
function groupsOf(
  workflow: WorkflowRecord,
  groups: readonly WorkGroupRecord[],
): WorkGroupRecord[] {
  const ids = new Set(workflow.steps.map((step) => step.workGroupId));
  return groups
    .filter((group) => ids.has(group.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function WorkflowsTable({
  workflows,
  groups,
  hrefFor,
  timeZone,
}: WorkflowsTableProps) {
  if (workflows.length === 0) {
    return <p className={styles.empty}>{Text.none}</p>;
  }

  return (
    <Table caption={Text.caption} minWidth={tableMinWidth}>
      <thead>
        <tr>
          <th scope="col">{Text.name}</th>
          <th scope="col">{Text.description}</th>
          <th scope="col" className={styles.number}>
            {Text.tasks}
          </th>
          <th scope="col">{Text.groups}</th>
          <th scope="col">{Text.updated}</th>
          <th scope="col">
            <span className={styles.hidden}>{Text.openColumn}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {workflows.map((workflow) => {
          const href = hrefFor(workflow.id);
          const used = groupsOf(workflow, groups);
          return (
            <tr key={workflow.id} className={styles.row}>
              <td>
                <Link to={href} className={styles.name}>
                  {workflow.name}
                </Link>
              </td>
              <td
                className={
                  workflow.description ? styles.description : styles.muted
                }
              >
                {workflow.description || Text.noDescription}
              </td>
              <td className={styles.number}>{workflow.steps.length}</td>
              <td>
                {used.length > 0 ? (
                  <span className={styles.chips}>
                    {used.map((group) => (
                      <Chip key={group.id} label={group.name} />
                    ))}
                  </span>
                ) : (
                  <span className={styles.muted}>{Text.noGroups}</span>
                )}
              </td>
              <td className={styles.muted}>
                {formatRecentDay(workflow.updatedAt, timeZone)}
              </td>
              <td className={styles.openCell}>
                <Link
                  to={href}
                  className={styles.open}
                  aria-label={Text.open(workflow.name)}
                  tabIndex={-1}
                >
                  <Icon name="next" />
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
