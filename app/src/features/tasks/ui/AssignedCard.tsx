// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/AssignedCard.tsx
// Version : 1.3.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Who a task is given to (a work group, a person, or both), who made
// it, and Reassign for people who may. The group and the person link to
// their pages.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { dataErrorMessage, type MemberRecord } from "@/core/data";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { memberName } from "@/features/members";
import type { WorkGroupRecord } from "@/features/work-groups";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Chip } from "@/shared/components/Chip/Chip";
import { Modal } from "@/shared/components/Modal/Modal";
import { useToast } from "@/shared/components/Toast/useToast";
import { groupPath, personPath } from "@/shared/constants/routePaths";
import { editedPartsAfter } from "../model/editedParts";
import { reassignTask } from "../service/taskService";
import type { TaskRecord } from "../types/taskTypes";
import { GiveToFields } from "./GiveToFields";
import { AssignedText as Text, ReassignText } from "./tasksContent";
import styles from "./TaskCards.module.css";

interface AssignedCardProps {
  task: TaskRecord;
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
  canReassign: boolean;
}

export function AssignedCard({
  task,
  groups,
  members,
  canReassign,
}: AssignedCardProps) {
  const [isReassigning, setIsReassigning] = useState(false);
  const group = groups.find((entry) => entry.id === task.workGroupId);
  const member = members.find((entry) => entry.id === task.memberId);
  const maker = members.find((entry) => entry.id === task.createdBy);

  return (
    <section className={styles.card} aria-labelledby="task-assigned">
      <h2 id="task-assigned" className={styles.title}>
        {Text.title}
      </h2>
      {group ? (
        <span className={styles.person}>
          <Link to={groupPath(group.id)} className={styles.plainLink}>
            <Chip label={group.name} />
          </Link>
          {member ? null : (
            <span className={styles.muted}>{Text.anyoneInGroup}</span>
          )}
        </span>
      ) : null}
      {member ? (
        <span className={styles.person}>
          <Avatar
            name={memberName(member)}
            src={member.photoUrl}
            size="small"
          />
          <Link to={personPath(member.id)} className={styles.plainLink}>
            {memberName(member)}
          </Link>
        </span>
      ) : null}
      {!group && !member ? <p className={styles.muted}>{Text.nobody}</p> : null}
      {maker ? (
        <p className={styles.muted}>{Text.createdBy(memberName(maker))}</p>
      ) : null}
      {canReassign ? (
        <Button
          size="small"
          iconStart="members"
          onClick={() => setIsReassigning(true)}
          className={styles.start}
        >
          {Text.reassign}
        </Button>
      ) : null}
      {isReassigning ? (
        <ReassignDialog
          task={task}
          groups={groups}
          members={members}
          onClose={() => setIsReassigning(false)}
        />
      ) : null}
    </section>
  );
}

function ReassignDialog({
  task,
  groups,
  members,
  onClose,
}: {
  task: TaskRecord;
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [assignee, setAssignee] = useState({
    workGroupId: task.workGroupId,
    memberId: task.memberId,
  });
  const save = useMutation({
    mutationFn: () =>
      reassignTask(
        task.id,
        assignee.workGroupId,
        assignee.memberId,
        editedPartsAfter(task, assignee),
      ),
    onSuccess: () => {
      toast.show({ tone: "success", title: ReassignText.done(task.title) });
      onClose();
    },
  });

  return (
    <Modal
      title={ReassignText.title}
      onClose={save.isPending ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {ReassignText.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={() => save.mutate()}
            isLoading={save.isPending}
          >
            {ReassignText.save}
          </Button>
        </>
      }
    >
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      <GiveToFields
        value={assignee}
        onChange={setAssignee}
        groups={groups}
        members={members}
      />
    </Modal>
  );
}
