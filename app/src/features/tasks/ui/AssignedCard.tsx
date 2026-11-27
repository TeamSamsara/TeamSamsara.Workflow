// File : /TeamSamsara.Workflow/app/src/features/tasks/ui/AssignedCard.tsx
// Version : 1.4.0
// Latest commit: feature/1.2-workload-b
// Author : Gerrah
// Purpose : Who a task is given to (a work group, a person, or both), who made
// it, and Reassign for people who may. The group and the person link to
// their pages.

import { decide } from "@engine/access/index";
import { taskSize } from "@engine/workload";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useActor } from "@/core/access";
import { dataErrorMessage, type MemberRecord } from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { memberName } from "@/features/members";
import type { WorkGroupRecord } from "@/features/work-groups";
import {
  fits,
  stateAt,
  useMemberWeeks,
  WeekPill,
  WeekStateText,
} from "@/features/workload";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { useNow } from "@/shared/hooks/useNow";
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
  const toast = useToast();
  const workspace = useWorkspaceRecord();
  const now = useNow();
  const group = groups.find((entry) => entry.id === task.workGroupId);
  const member = members.find((entry) => entry.id === task.memberId);
  const maker = members.find((entry) => entry.id === task.createdBy);
  // Waiting with the group, meant for someone who had no room.
  const meant =
    task.memberId === null
      ? members.find((entry) => entry.id === task.meantFor)
      : undefined;
  const meantWeeks = useMemberWeeks(meant ? [meant.id] : []);
  const meantState = meant
    ? stateAt(meantWeeks.get(meant.id), task.dueAt ?? now, workspace)
    : null;
  const giveToMeant = useMutation({
    mutationFn: () =>
      reassignTask(
        task.id,
        task.workGroupId,
        meant?.id ?? null,
        editedPartsAfter(task, {
          workGroupId: task.workGroupId,
          memberId: meant?.id ?? null,
        }),
      ),
    onSuccess: () =>
      toast.show({ tone: "success", title: ReassignText.done(task.title) }),
    onError: (error) =>
      toast.show({ tone: "error", title: dataErrorMessage(error) }),
  });
  const past =
    task.givenPastCapacity && task.givenPastCapacity.memberId === task.memberId
      ? task.givenPastCapacity
      : null;

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
      {meant ? (
        <div className={styles.meant}>
          <span className={styles.person}>
            <b>{Text.meantFor(memberName(meant))}</b>
            {meantState ? <WeekPill state={meantState} /> : null}
          </span>
          <p className={styles.muted}>{Text.meantWhy(memberName(meant))}</p>
          {canReassign ? (
            <Button
              size="small"
              variant="primary"
              className={styles.start}
              onClick={() => giveToMeant.mutate()}
              disabled={!fits(meantState, taskSize(task))}
              isLoading={giveToMeant.isPending}
            >
              {Text.giveTo(memberName(meant))}
            </Button>
          ) : null}
        </div>
      ) : null}
      {past ? (
        <p className={styles.quote}>
          <b>
            {Text.givenPast(
              members.find((entry) => entry.id === past.by)
                ? memberName(members.find((entry) => entry.id === past.by)!)
                : null,
            )}
          </b>{" "}
          {past.reason}
        </p>
      ) : null}
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
  const actor = useActor();
  const workspace = useWorkspaceRecord();
  const now = useNow();
  const weeks = useMemberWeeks(members.map((member) => member.id));
  const [assignee, setAssignee] = useState({
    workGroupId: task.workGroupId,
    memberId: task.memberId,
  });
  const [reason, setReason] = useState("");
  const size = taskSize(task);
  const canOverride = actor
    ? decide(actor, { action: "workload.set" }).ok
    : false;
  const stateOf = (memberId: string) =>
    stateAt(weeks.get(memberId), task.dueAt ?? now, workspace);
  const chosen = members.find((member) => member.id === assignee.memberId);
  // Someone new without room for it: only an override, with a reason.
  const pastCapacity =
    chosen !== undefined &&
    chosen.id !== task.memberId &&
    !fits(stateOf(chosen.id), size);
  const save = useMutation({
    mutationFn: () =>
      reassignTask(
        task.id,
        assignee.workGroupId,
        assignee.memberId,
        editedPartsAfter(task, assignee),
        pastCapacity && actor ? { by: actor.id, reason } : undefined,
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
            disabled={pastCapacity && !reason.trim()}
            isLoading={save.isPending}
          >
            {pastCapacity ? ReassignText.givePast : ReassignText.save}
          </Button>
        </>
      }
    >
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      <p className={styles.muted}>
        {ReassignText.taskLine(task.title, size === "bigger")}
      </p>
      <GiveToFields
        value={assignee}
        onChange={setAssignee}
        groups={groups}
        members={members}
        personWeek={(member) => {
          const state = stateOf(member.id);
          return {
            note: state ? WeekStateText[state].label : null,
            canPick: canOverride || fits(state, size),
          };
        }}
      />
      {pastCapacity && chosen ? (
        <>
          <Banner tone="alert">
            {ReassignText.pastCapacity(
              memberName(chosen),
              WeekStateText[stateOf(chosen.id) ?? "atCapacity"].label,
              size === "bigger",
            )}
          </Banner>
          <TextArea
            label={ReassignText.why(memberName(chosen))}
            hint={ReassignText.whyHint(memberName(chosen))}
            value={reason}
            rows={3}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
          />
        </>
      ) : (
        <p className={styles.muted}>{ReassignText.noRoom}</p>
      )}
    </Modal>
  );
}
