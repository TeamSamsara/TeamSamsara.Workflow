// File : /TeamSamsara.Workflow/app/src/views/workflows/WorkflowEditView.tsx
// Version : 1.1.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The workflow editor: its tasks on the left (open one in place to
// edit it), About and the event details it uses on the right; Save, Export,
// Archive or Restore, and Delete once archived. Also opens a new workflow,
// blank or from an import. Without Edit workflows, everything is read-only.

import { useMutation } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { usePermissions } from "@/core/access";
import { dataErrorMessage, isCurrentMember } from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import { useMembers } from "@/features/members";
import { usePlatforms } from "@/features/platforms";
import { useEventTypes, useTags } from "@/features/task-setup";
import { useWorkGroups } from "@/features/work-groups";
import {
  AboutCard,
  addStep,
  changeStep,
  deleteWorkflow,
  duplicateStep,
  emptyWorkflow,
  exportFileName,
  exportWorkflow,
  GapsCard,
  newStep,
  orderSteps,
  removeStep,
  setWorkflowArchived,
  StepList,
  useWorkflow,
  useWorkflowDraft,
  type StepEditorOptions,
  type WorkflowRecord,
} from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Modal } from "@/shared/components/Modal/Modal";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import {
  NewWorkflowId,
  RoutePaths,
  workflowPath,
} from "@/shared/constants/routePaths";
import { cameFromGuide, readImportedWorkflow } from "./importedWorkflow";
import { WorkflowEditViewText as Text } from "./workflowEditViewContent";
import styles from "./WorkflowEditView.module.css";

type ListAction = "archive" | "restore" | "delete";

function downloadFile(name: string, contents: string) {
  const url = URL.createObjectURL(
    new Blob([contents], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function WorkflowEditor({ workflow }: { workflow: WorkflowRecord | null }) {
  const canEdit = usePermissions().can("editWorkflows");
  const workspace = useWorkspaceRecord();
  const groups = useWorkGroups();
  const members = useMembers();
  const tags = useTags();
  const eventTypes = useEventTypes();
  const platforms = usePlatforms();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const imported = useMemo(
    () => (workflow ? null : readImportedWorkflow(location.state)),
    [workflow, location.state],
  );
  const draft = useWorkflowDraft(workflow, imported?.imported ?? emptyWorkflow);
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [triedToSave, setTriedToSave] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(() =>
    cameFromGuide(location.state),
  );
  // Set just before leaving on purpose (after a save or delete), so the
  // unsaved-changes check lets the page go.
  const leaving = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !leaving.current &&
      draft.isDirty &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  const listAction = useMutation({
    mutationFn: async (action: ListAction) => {
      if (!workflow) return;
      if (action === "delete") await deleteWorkflow(workflow.id);
      else await setWorkflowArchived(workflow.id, action === "archive");
    },
    onSuccess: (_result, action) => {
      if (!workflow) return;
      const done = {
        archive: Text.archived,
        restore: Text.restored,
        delete: Text.deleted,
      }[action];
      toast.show({ tone: "success", title: done(workflow.name) });
      if (action === "delete") {
        leaving.current = true;
        navigate(RoutePaths.workflows, { replace: true });
      }
    },
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.actionFailed,
        detail: dataErrorMessage(error),
      }),
  });

  const options: StepEditorOptions = {
    groups: groups.items.map((item) => item.group),
    members: members.records.filter(isCurrentMember),
    tags: tags.items,
    platforms: platforms.settings,
    clockFormat: workspace.timeFormat,
  };

  const { fields, problems } = draft;
  const name = fields.name.trim();
  const title = workflow ? name || Text.untitled : name || Text.newTitle;
  const showProblems = triedToSave && problems.count > 0;

  function save() {
    setTriedToSave(true);
    if (problems.count > 0) {
      const firstStep = fields.steps.find((step) => problems.steps[step.id]);
      if (firstStep) setOpenStepId(firstStep.id);
      return;
    }
    draft.save((savedId) => {
      toast.show({
        tone: "success",
        title: (workflow ? Text.saved : Text.created)(name),
      });
      setTriedToSave(false);
      if (!workflow) {
        leaving.current = true;
        navigate(workflowPath(savedId), { replace: true });
      }
    });
  }

  function addTask() {
    const step = newStep();
    draft.changeSteps((steps) => addStep(steps, step));
    setOpenStepId(step.id);
  }

  const busy = draft.isSaving || listAction.isPending;
  const actions = canEdit ? (
    <>
      {workflow ? (
        <Button
          iconStart="download"
          onClick={() =>
            downloadFile(
              exportFileName(workflow.name),
              exportWorkflow(workflow),
            )
          }
          disabled={draft.isDirty}
          title={draft.isDirty ? Text.exportFirst : undefined}
        >
          {Text.export}
        </Button>
      ) : null}
      {workflow && !workflow.archived ? (
        <Button
          iconStart="archive"
          onClick={() => listAction.mutate("archive")}
          disabled={busy}
        >
          {Text.archive}
        </Button>
      ) : null}
      {workflow?.archived ? (
        <>
          <Button
            iconStart="trash"
            variant="ghost"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={busy}
          >
            {Text.delete}
          </Button>
          <Button
            iconStart="reset"
            onClick={() => listAction.mutate("restore")}
            disabled={busy}
          >
            {Text.restore}
          </Button>
        </>
      ) : null}
      {workflow ? (
        <Button
          variant="ghost"
          onClick={() => {
            draft.reset();
            setTriedToSave(false);
          }}
          disabled={!draft.isDirty || busy}
        >
          {Text.reset}
        </Button>
      ) : null}
      <Button
        variant="primary"
        onClick={save}
        disabled={(workflow !== null && !draft.isDirty) || listAction.isPending}
        isLoading={draft.isSaving}
      >
        {workflow ? Text.save : Text.create}
      </Button>
    </>
  ) : null;

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: Text.workflows, to: RoutePaths.workflows },
          { label: title },
        ]}
        actions={actions}
      />

      {!canEdit ? <Banner tone="info">{Text.readOnly}</Banner> : null}
      {showNextSteps && workflow ? (
        <Banner
          tone="success"
          icon="check"
          action={
            <Button
              size="small"
              variant="ghost"
              onClick={() => setShowNextSteps(false)}
            >
              {Text.nextSteps.dismiss}
            </Button>
          }
        >
          <b>{Text.nextSteps.title}</b> {Text.nextSteps.body}
        </Banner>
      ) : null}
      {workflow?.archived ? (
        <Banner tone="info" icon="archive">
          {Text.archivedNote}
        </Banner>
      ) : null}
      {imported && !workflow ? (
        <Banner tone="info" icon="upload">
          {Text.imported(imported.dropped)}
        </Banner>
      ) : null}
      {showProblems ? (
        <Banner tone="error">{Text.problems(problems.count)}</Banner>
      ) : null}
      {draft.saveError ? <Banner tone="error">{draft.saveError}</Banner> : null}

      <div className={styles.columns}>
        <div className={styles.main}>
          <StepList
            steps={fields.steps}
            openStepId={openStepId}
            onOpen={setOpenStepId}
            onChange={(stepId, changes) =>
              draft.changeSteps((steps) => changeStep(steps, stepId, changes))
            }
            onReorder={(orderedIds) =>
              draft.changeSteps((steps) => orderSteps(steps, orderedIds))
            }
            onAdd={addTask}
            onDuplicate={(stepId) => {
              const result = duplicateStep(fields.steps, stepId);
              draft.change({ steps: result.steps });
              setOpenStepId(result.copyId);
            }}
            onRemove={(stepId) =>
              draft.changeSteps((steps) => removeStep(steps, stepId))
            }
            problems={problems}
            showProblems={triedToSave}
            options={options}
            readOnly={!canEdit}
          />
        </div>
        {/* A disabled fieldset turns every field inside read-only. */}
        <fieldset className={styles.side} disabled={!canEdit || busy}>
          <AboutCard
            fields={fields}
            onChange={draft.change}
            eventTypes={eventTypes.items}
            nameError={triedToSave ? problems.name : undefined}
            descriptionError={triedToSave ? problems.description : undefined}
          />
          <GapsCard steps={fields.steps} />
        </fieldset>
      </div>

      {isConfirmingDelete && workflow ? (
        <Modal
          title={Text.confirmDelete.title(workflow.name)}
          onClose={() => setIsConfirmingDelete(false)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setIsConfirmingDelete(false)}
              >
                {Text.confirmDelete.cancel}
              </Button>
              <Button
                variant="danger"
                iconStart="trash"
                isLoading={listAction.isPending}
                onClick={() => listAction.mutate("delete")}
              >
                {Text.confirmDelete.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{Text.confirmDelete.body}</p>
        </Modal>
      ) : null}

      {blocker.state === "blocked" ? (
        <Modal
          title={Text.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {Text.discard.keep}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  draft.reset();
                  blocker.proceed();
                }}
              >
                {Text.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{Text.discard.body}</p>
        </Modal>
      ) : null}
    </>
  );
}

export function WorkflowEditView() {
  const { workflowId } = useParams();
  const isNew = workflowId === NewWorkflowId;
  const workflow = useWorkflow(isNew ? undefined : workflowId);

  return (
    <div className={styles.page}>
      {isNew ? (
        <WorkflowEditor key={NewWorkflowId} workflow={null} />
      ) : workflow === undefined ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : workflow === null ? (
        <div className={styles.missing}>
          <Banner tone="info">{Text.notFound}</Banner>
          <LinkButton
            to={RoutePaths.workflows}
            iconStart="back"
            variant="ghost"
          >
            {Text.backToList}
          </LinkButton>
        </div>
      ) : (
        <WorkflowEditor key={workflow.id} workflow={workflow} />
      )}
    </div>
  );
}
