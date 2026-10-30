// File : /TeamSamsara.Workflow/app/src/views/workflows/WorkflowsView.tsx
// Version : 1.2.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The Workflows page: every workflow in a table, in use or archived,
// with New workflow (with the guide, or blank) and Import. The first visit
// opens the tutorial; How it works opens it again. An import opens in the
// editor as a new, unsaved workflow.

import { useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  WorkflowTutorial,
} from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { ButtonContent } from "@/shared/components/Button/ButtonContent";
import { buttonLook } from "@/shared/components/Button/buttonLook";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Dropdown } from "@/shared/components/Dropdown/Dropdown";
import { DropdownItem } from "@/shared/components/Dropdown/DropdownItem";
import { DropdownPanel } from "@/shared/components/Dropdown/DropdownPanel";
import { DropdownTrigger } from "@/shared/components/Dropdown/DropdownTrigger";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths, workflowPath } from "@/shared/constants/routePaths";
import { StorageKeys } from "@/shared/constants/storageKeys";
import { useDismissed } from "@/shared/hooks/useDismissed";
import { Icon } from "@/shared/icons/Icon";
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
  const tutorialSeen = useDismissed(StorageKeys.workflowsTutorialSeen);
  // First visit: the tutorial opens by itself; afterwards from How it works.
  const [isTutorialOpen, setIsTutorialOpen] = useState(!tutorialSeen.dismissed);

  const archived = workflows.items.filter((workflow) => workflow.archived);
  const active = workflows.items.filter((workflow) => !workflow.archived);
  const filterOptions = (["active", "archived"] as const).map((value) => ({
    value,
    label: Text.filterWithCount(
      Text.filters[value],
      value === "active" ? active.length : archived.length,
    ),
  }));

  function closeTutorial() {
    tutorialSeen.dismiss();
    setIsTutorialOpen(false);
  }

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

  const isEmpty = workflows.status === "ready" && workflows.items.length === 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        description={Text.description}
        actions={
          <>
            <Button
              variant="ghost"
              iconStart="help"
              onClick={() => setIsTutorialOpen(true)}
            >
              {Text.howItWorks}
            </Button>
            {canEdit ? (
              <>
                <Button
                  iconStart="upload"
                  onClick={() => fileInput.current?.click()}
                >
                  {Text.import}
                </Button>
                <Dropdown>
                  <DropdownTrigger
                    popup="menu"
                    {...buttonLook("primary", "medium", false)}
                  >
                    <ButtonContent iconStart="add" iconEnd="chevronDown">
                      {Text.new}
                    </ButtonContent>
                  </DropdownTrigger>
                  <DropdownPanel
                    role="menu"
                    placement="bottom-end"
                    aria-label={Text.new}
                  >
                    <DropdownItem
                      as={Link}
                      to={RoutePaths.workflowGuide}
                      role="menuitem"
                      className={styles.menuItem}
                    >
                      <b>{Text.newGuided}</b>
                      <span className={styles.muted}>
                        {Text.newGuidedDetail}
                      </span>
                    </DropdownItem>
                    <DropdownItem
                      as={Link}
                      to={workflowPath()}
                      role="menuitem"
                      className={styles.menuItem}
                    >
                      <b>{Text.newBlank}</b>
                      <span className={styles.muted}>
                        {Text.newBlankDetail}
                      </span>
                    </DropdownItem>
                  </DropdownPanel>
                </Dropdown>
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
            ) : null}
          </>
        }
      />

      {!canEdit ? <Banner tone="info">{Text.readOnly}</Banner> : null}

      {isEmpty ? (
        <section className={styles.first}>
          <span className={styles.firstIcon} aria-hidden="true">
            <Icon name="workflows" />
          </span>
          <h2 className={styles.firstTitle}>{Text.firstTitle}</h2>
          <p className={styles.firstBody}>{Text.firstBody}</p>
          {canEdit ? (
            <LinkButton
              to={RoutePaths.workflowGuide}
              variant="primary"
              iconStart="add"
            >
              {Text.firstAction}
            </LinkButton>
          ) : null}
        </section>
      ) : (
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
      )}

      {isTutorialOpen ? (
        <WorkflowTutorial
          canCreate={canEdit}
          hasWorkflows={workflows.items.length > 0}
          onClose={closeTutorial}
          onStartGuide={() => {
            closeTutorial();
            navigate(RoutePaths.workflowGuide);
          }}
        />
      ) : null}
    </div>
  );
}
