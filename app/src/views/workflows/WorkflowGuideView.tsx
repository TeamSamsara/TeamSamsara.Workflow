// File : /TeamSamsara.Workflow/app/src/views/workflows/WorkflowGuideView.tsx
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : The guided setup page: the guide in the middle of the page, a
// question before leaving with answers filled in, and on creating, the new
// workflow opened in the editor with a note on what to do next.

import { useRef, useState } from "react";
import { Navigate, useBlocker, useNavigate } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { isCurrentMember } from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import { useMembers } from "@/features/members";
import { useWorkGroups } from "@/features/work-groups";
import { WorkflowGuide, type GuideAnswers } from "@/features/workflows";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths, workflowPath } from "@/shared/constants/routePaths";
import type { CreatedFromGuide } from "./importedWorkflow";
import { WorkflowGuideViewText as Text } from "./workflowGuideViewContent";
import styles from "./WorkflowEditView.module.css";

const noAnswers: GuideAnswers = { name: "", description: "", tasks: [] };

export function WorkflowGuideView() {
  const canEdit = usePermissions().can("editWorkflows");
  const workspace = useWorkspaceRecord();
  const groups = useWorkGroups();
  const members = useMembers();
  const toast = useToast();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<GuideAnswers>(noAnswers);
  const leaving = useRef(false);

  const hasAnswers =
    answers.name.trim() !== "" ||
    answers.description.trim() !== "" ||
    answers.tasks.length > 0;
  const blocker = useBlocker(() => !leaving.current && hasAnswers);

  if (!canEdit) return <Navigate to={RoutePaths.workflows} replace />;

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        breadcrumbs={[
          { label: Text.workflows, to: RoutePaths.workflows },
          { label: Text.title },
        ]}
      />
      <WorkflowGuide
        answers={answers}
        onChange={setAnswers}
        groups={groups.items.map((item) => item.group)}
        members={members.records.filter(isCurrentMember)}
        clockFormat={workspace.timeFormat}
        onCancel={() => navigate(RoutePaths.workflows)}
        onCreated={(workflowId) => {
          toast.show({
            tone: "success",
            title: Text.created(answers.name.trim()),
          });
          leaving.current = true;
          const state: CreatedFromGuide = { fromGuide: true };
          navigate(workflowPath(workflowId), { replace: true, state });
        }}
      />

      {blocker.state === "blocked" ? (
        <Modal
          title={Text.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {Text.discard.keep}
              </Button>
              <Button variant="danger" onClick={() => blocker.proceed()}>
                {Text.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{Text.discard.body}</p>
        </Modal>
      ) : null}
    </div>
  );
}
