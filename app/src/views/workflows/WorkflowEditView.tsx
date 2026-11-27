// File : /TeamSamsara.Workflow/app/src/views/workflows/WorkflowEditView.tsx
// Version : 2.3.0
// Latest commit: feature/1.2-after-saving
// Author : Gerrah
// Purpose : The workflow editor: About and the steps in due order on the left,
// the one picked open in the middle in its six parts, and beside it how the
// step reads, where it sits in the flow and the checks. List | Flow switches
// to the steps drawn as a flow, linked by their order rules; Preview on a
// date shows the tasks it would make for an event then. Save, Export,
// Archive or Restore, and Delete once archived. Saving a workflow that
// upcoming events use never moves their tasks: those whose due time now
// differs from their step are listed after saving, to move or leave. Also opens a new workflow,
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
import { useSession } from "@/core/session";
import { dataErrorMessage, isCurrentMember } from "@/core/data";
import { useDisplayTime } from "@/core/workspace";
import { useMembers } from "@/features/members";
import { formatDue } from "@/features/tasks";
import { usePlatforms } from "@/features/platforms";
import { useEventTypes, useTags } from "@/features/task-setup";
import { useWorkGroups } from "@/features/work-groups";
import {
  AboutCard,
  addStep,
  AfterSavingDialog,
  byDue,
  canAddStep,
  changeStep,
  deleteWorkflow,
  duplicateStep,
  emptyWorkflow,
  exportFileName,
  exportWorkflow,
  GapsCard,
  newStep,
  removeStep,
  setWorkflowArchived,
  StepEditor,
  StepNav,
  StepRail,
  useWorkflow,
  useWorkflowDraft,
  useWorkflowReview,
  WorkflowFlow,
  type EditorSelection,
  type StepEditorOptions,
  type WorkflowRecord,
} from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Modal } from "@/shared/components/Modal/Modal";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import {
  NewWorkflowId,
  RoutePaths,
  workflowPath,
} from "@/shared/constants/routePaths";
import { cameFromGuide, readImportedWorkflow } from "./importedWorkflow";
import { WorkflowEditViewText as Text } from "./workflowEditViewContent";
import { WorkflowPreviewDialog } from "./WorkflowPreviewDialog";
import styles from "./WorkflowEditView.module.css";

type ListAction = "archive" | "restore" | "delete";
type StepsView = "list" | "flow";

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
  const access = usePermissions();
  const canEdit = access.can("editWorkflows");
  // Updating the tasks means reading every upcoming event and moving tasks,
  // so it's offered to planners who see everything.
  const time = useDisplayTime();
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
  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [view, setView] = useState<StepsView>("list");
  const [isPreviewing, setIsPreviewing] = useState(false);
  // When this page last saved, to show the tasks that differ from it after.
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [reviewClosed, setReviewClosed] = useState<string | null>(null);
  const session = useSession();
  const review = useWorkflowReview(
    workflow?.id ?? null,
    session.status === "active" ? session.member.id : null,
    savedAt,
  );
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
    clockFormat: time.timeFormat,
  };

  const { fields, problems } = draft;
  const name = fields.name.trim();
  const title = workflow ? name || Text.untitled : name || Text.newTitle;
  const showProblems = triedToSave && problems.count > 0;
  // Shown and numbered in due order, the way the tasks will come.
  const steps = byDue(fields.steps);
  // Opens on the first step; About when there are none, or when the picked
  // step is gone.
  const openStep =
    selection === "about"
      ? undefined
      : (steps.find((step) => step.id === selection) ??
        (selection === null ? steps[0] : undefined));
  const changeOpen = (changes: Parameters<typeof changeStep>[2]) => {
    if (openStep)
      draft.changeSteps((current) => changeStep(current, openStep.id, changes));
  };

  function save() {
    setTriedToSave(true);
    if (problems.count > 0) {
      if (problems.name || problems.description) setSelection("about");
      else {
        const firstStep = steps.find((step) => problems.steps[step.id]);
        if (firstStep) setSelection(firstStep.id);
      }
      return;
    }
    draft.save((savedId) => {
      toast.show({
        tone: "success",
        title: (workflow ? Text.saved : Text.created)(name),
        // Upcoming events follow in the background (see onWorkflowSaved).
        detail: workflow ? Text.upcomingFollow : undefined,
      });
      setTriedToSave(false);
      if (workflow) setSavedAt(new Date());
      if (!workflow) {
        leaving.current = true;
        navigate(workflowPath(savedId), { replace: true });
      }
    });
  }

  function addTask() {
    const step = newStep();
    draft.changeSteps((current) => addStep(current, step));
    setSelection(step.id);
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

      {steps.length > 0 ? (
        <div className={styles.toolbar}>
          <SegmentedControl<StepsView>
            label={Text.views.label}
            options={[
              { value: "list", label: Text.views.list },
              { value: "flow", label: Text.views.flow },
            ]}
            value={view}
            onChange={setView}
          />
          <Button iconStart="calendar" onClick={() => setIsPreviewing(true)}>
            {Text.previewOpen}
          </Button>
        </div>
      ) : null}

      {view === "flow" && steps.length > 0 ? (
        <WorkflowFlow
          steps={steps}
          problems={problems}
          options={options}
          selectedId={openStep?.id ?? null}
          onSelect={setSelection}
          onChangeStep={(stepId, changes) =>
            draft.changeSteps((current) => changeStep(current, stepId, changes))
          }
          onReplaceSteps={(next) => draft.change({ steps: next })}
          onOpenStep={(stepId) => {
            setSelection(stepId);
            setView("list");
          }}
          readOnly={!canEdit || busy}
        />
      ) : (
        <div className={styles.columns} data-about={openStep ? undefined : ""}>
          <div className={styles.nav}>
            <StepNav
              steps={steps}
              selected={openStep?.id ?? "about"}
              onSelect={setSelection}
              onAdd={addTask}
              problems={problems}
              showProblems={triedToSave}
              aboutProblem={Boolean(problems.name || problems.description)}
              options={options}
              readOnly={!canEdit}
            />
          </div>
          {/* A disabled fieldset turns every field inside read-only. */}
          <fieldset className={styles.main} disabled={!canEdit || busy}>
            {openStep ? (
              <StepEditor
                key={openStep.id}
                steps={steps}
                step={openStep}
                onChange={changeOpen}
                problems={problems.steps[openStep.id]}
                showProblems={triedToSave}
                options={options}
                onDuplicate={() => {
                  const result = duplicateStep(fields.steps, openStep.id);
                  draft.change({ steps: result.steps });
                  if (result.copyId) setSelection(result.copyId);
                }}
                canDuplicate={canAddStep(fields.steps)}
                onRemove={() => {
                  const index = steps.indexOf(openStep);
                  const next = steps[index + 1] ?? steps[index - 1];
                  draft.changeSteps((current) =>
                    removeStep(current, openStep.id),
                  );
                  setSelection(next?.id ?? "about");
                }}
                readOnly={!canEdit}
              />
            ) : (
              <>
                <AboutCard
                  fields={fields}
                  onChange={draft.change}
                  eventTypes={eventTypes.items}
                  nameError={triedToSave ? problems.name : undefined}
                  descriptionError={
                    triedToSave ? problems.description : undefined
                  }
                />
                <GapsCard steps={fields.steps} />
              </>
            )}
          </fieldset>
          {openStep ? (
            <div className={styles.side}>
              <StepRail
                steps={steps}
                step={openStep}
                problems={problems}
                options={options}
                onFixDue={(due) => changeOpen({ due })}
                onOpen={setSelection}
                readOnly={!canEdit}
              />
            </div>
          ) : null}
        </div>
      )}

      {review && review.id !== reviewClosed && !review.left ? (
        <AfterSavingDialog
          review={review}
          formatWhen={(date) =>
            formatDue(date, time.timeZone, time.timeFormat, time.dateFormat)
          }
          onClose={() => setReviewClosed(review.id)}
        />
      ) : null}

      {isPreviewing ? (
        <WorkflowPreviewDialog
          workflowId={workflow?.id ?? null}
          fields={fields}
          options={options}
          onClose={() => setIsPreviewing(false)}
        />
      ) : null}

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
