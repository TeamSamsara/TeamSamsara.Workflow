// File : /TeamSamsara.Workflow/app/src/views/workflows/WorkflowsView.tsx
// Version : 1.0.0
// Latest commit: feature/workflows
// Author : Gerrah
// Purpose : The Workflows page: every workflow in a table, in use or archived,
// with New workflow and Import. An import opens in the editor as a new,
// unsaved workflow.

import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { DataErrorText } from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import { useMembers } from "@/features/members";
import { usePlatforms } from "@/features/platforms";
import { useEventTypes, useTags } from "@/features/task-setup";
import { useWorkGroups } from "@/features/work-groups";
import {
  importWorkflow,
  useWorkflows,
  WorkflowsTable,
} from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { workflowPath } from "@/shared/constants/routePaths";
import type { ImportedWorkflow } from "./importedWorkflow";
import { WorkflowsViewText as Text } from "./workflowsViewContent";
import styles from "./WorkflowsView.module.css";

type Filter = "active" | "archived";

export function WorkflowsView() {
  const canEdit = usePermissions().can("editWorkflows");
  const workspace = useWorkspaceRecord();
  const workflows = useWorkflows();
  const groups = useWorkGroups();
  const members = useMembers();
  const tags = useTags();
  const eventTypes = useEventTypes();
  const platforms = usePlatforms();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>("active");

  const archived = workflows.items.filter((workflow) => workflow.archived);
  const active = workflows.items.filter((workflow) => !workflow.archived);
  const filterOptions = (["active", "archived"] as const).map((value) => ({
    value,
    label: Text.filterWithCount(
      Text.filters[value],
      value === "active" ? active.length : archived.length,
    ),
  }));

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = importWorkflow(await file.text(), {
      workGroupIds: groups.items.map((item) => item.group.id),
      memberIds: members.records.map((member) => member.id),
      tagIds: tags.items.map((tag) => tag.id),
      eventTypeIds: eventTypes.items.map((type) => type.id),
      platformIds: platforms.enabled.map((platform) => platform.id),
      workflowNames: workflows.items.map((workflow) => workflow.name),
    });
    if (!result.ok) {
      toast.show({
        tone: "error",
        title: Text.importFailed,
        detail: result.error,
      });
      return;
    }
    const state: ImportedWorkflow = {
      imported: result.fields,
      dropped: result.dropped,
    };
    navigate(workflowPath(), { state });
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        description={Text.description}
        actions={
          canEdit ? (
            <>
              <Button
                iconStart="upload"
                onClick={() => fileInput.current?.click()}
              >
                {Text.import}
              </Button>
              <LinkButton to={workflowPath()} variant="primary" iconStart="add">
                {Text.new}
              </LinkButton>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className={styles.fileInput}
                aria-label={Text.importLabel}
                tabIndex={-1}
                onChange={(event) => void handleFile(event)}
              />
            </>
          ) : null
        }
      />

      {!canEdit ? <Banner tone="info">{Text.readOnly}</Banner> : null}

      <section className={styles.card}>
        <SegmentedControl
          label={Text.filterLabel}
          options={filterOptions}
          value={filter}
          onChange={setFilter}
          className={styles.filter}
        />
        {workflows.status === "loading" ? (
          <div className={styles.loading}>
            <Spinner label={Text.loading} />
          </div>
        ) : workflows.status === "error" ? (
          <Banner tone="error">
            {DataErrorText[workflows.error ?? "unknown"]}
          </Banner>
        ) : (
          <WorkflowsTable
            workflows={filter === "active" ? active : archived}
            groups={groups.items.map((item) => item.group)}
            hrefFor={workflowPath}
            timeZone={workspace.timeZone}
          />
        )}
      </section>
    </div>
  );
}
