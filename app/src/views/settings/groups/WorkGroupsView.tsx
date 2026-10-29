// File : /TeamSamsara.Workflow/app/src/views/settings/groups/WorkGroupsView.tsx
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Settings → Work groups: the group cards on top, the open group's
// editor under them (name, what it does, who is in it, with Add members and
// Remove), New group and Delete group. Leaving a group with unsaved changes
// asks first; adding and removing people saves straight away.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, useBlocker, useNavigate, useParams } from "react-router-dom";
import { DataErrorText, dataErrorMessage } from "@/core/data";
import { memberName, MemberPicker, useMembers } from "@/features/members";
import {
  addToWorkGroup,
  DeleteWorkGroupDialog,
  NewWorkGroupDialog,
  removeFromWorkGroup,
  useWorkGroupDraft,
  useWorkGroups,
  WorkGroupForm,
  WorkGroupGrid,
  type WorkGroupListItem,
} from "@/features/work-groups";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { StatusPanel } from "@/shared/components/StatusPanel/StatusPanel";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths, workGroupPath } from "@/shared/constants/routePaths";
import { WorkGroupsViewText } from "./workGroupsViewContent";
import styles from "./WorkGroupsView.module.css";

// #region The open group
function WorkGroupEditor({ item }: { item: WorkGroupListItem }) {
  const { group, members } = item;
  const draft = useWorkGroupDraft(group);
  const toast = useToast();
  const navigate = useNavigate();
  const allMembers = useMembers();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const onError = (error: unknown) =>
    toast.show({
      tone: "error",
      title: WorkGroupsViewText.failed,
      detail: dataErrorMessage(error),
    });
  const add = useMutation({
    mutationFn: (memberIds: string[]) => addToWorkGroup(group.id, memberIds),
    onSuccess: (_result, memberIds) => {
      setIsPicking(false);
      toast.show({
        tone: "success",
        title: WorkGroupsViewText.added(memberIds.length, group.name),
      });
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: ({ memberId }: { memberId: string; name: string }) =>
      removeFromWorkGroup(group.id, memberId),
    onSuccess: (_result, { name }) =>
      toast.show({
        tone: "success",
        title: WorkGroupsViewText.removed(name, group.name),
      }),
    onError,
  });

  const blocker = useBlocker(
    ({ nextLocation }) =>
      draft.isDirty && nextLocation.pathname !== workGroupPath(group.id),
  );

  function save() {
    const name = draft.fields.name.trim();
    draft.save(() =>
      toast.show({ tone: "success", title: WorkGroupsViewText.saved(name) }),
    );
  }

  return (
    <section className={styles.editor} aria-labelledby={`group-${group.id}`}>
      <header className={styles.editorHeader}>
        <h2 id={`group-${group.id}`} className={styles.heading}>
          {group.name}
        </h2>
        <div className={styles.actions}>
          <Button
            variant="ghost"
            iconStart="trash"
            onClick={() => setIsDeleting(true)}
            disabled={draft.isSaving}
          >
            {WorkGroupsViewText.deleteGroup}
          </Button>
          <Button
            variant="ghost"
            onClick={draft.reset}
            disabled={!draft.isDirty || draft.isSaving}
          >
            {WorkGroupsViewText.reset}
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={!draft.isDirty || Boolean(draft.nameError)}
            isLoading={draft.isSaving}
          >
            {WorkGroupsViewText.save}
          </Button>
        </div>
      </header>

      {draft.saveError ? <Banner tone="error">{draft.saveError}</Banner> : null}

      <WorkGroupForm
        fields={draft.fields}
        onChange={draft.change}
        nameError={draft.nameError}
        disabled={draft.isSaving}
      />

      <div className={styles.members}>
        <div className={styles.membersHeader}>
          <h3 className={styles.subheading}>
            {WorkGroupsViewText.membersHeading}
          </h3>
          <Button
            size="small"
            iconStart="add"
            onClick={() => setIsPicking(true)}
            disabled={allMembers.status !== "ready"}
          >
            {WorkGroupsViewText.addMembers}
          </Button>
        </div>
        {members === null ? (
          <Spinner label={WorkGroupsViewText.loading} />
        ) : members.length === 0 ? (
          <p className={styles.muted}>{WorkGroupsViewText.noMembers}</p>
        ) : (
          <ul className={styles.memberList}>
            {members.map((member) => {
              const name = memberName(member);
              return (
                <li key={member.id} className={styles.member}>
                  <Avatar name={name} size="small" />
                  <span className={styles.memberText}>
                    <b>{name}</b>
                    <span className={styles.muted}>{member.email}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label={WorkGroupsViewText.removeLabel(
                      name,
                      group.name,
                    )}
                    onClick={() => remove.mutate({ memberId: member.id, name })}
                    disabled={remove.isPending}
                  >
                    {WorkGroupsViewText.remove}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <p className={styles.muted}>{WorkGroupsViewText.membersNote}</p>
      </div>

      {isPicking ? (
        <MemberPicker
          title={WorkGroupsViewText.pickerTitle(group.name)}
          items={allMembers.items.filter(
            (entry) => !entry.member.workGroupIds.includes(group.id),
          )}
          onPick={(memberIds) => add.mutate(memberIds)}
          onClose={() => setIsPicking(false)}
          isSaving={add.isPending}
        />
      ) : null}

      {isDeleting ? (
        <DeleteWorkGroupDialog
          group={group}
          memberCount={members?.length ?? null}
          onClose={() => setIsDeleting(false)}
          onDeleted={() => {
            draft.reset();
            navigate(RoutePaths.settingsGroups, { replace: true });
          }}
        />
      ) : null}

      {blocker.state === "blocked" ? (
        <Modal
          title={WorkGroupsViewText.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {WorkGroupsViewText.discard.keep}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  draft.reset();
                  blocker.proceed();
                }}
              >
                {WorkGroupsViewText.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{WorkGroupsViewText.discard.body}</p>
        </Modal>
      ) : null}
    </section>
  );
}
// #endregion

export function WorkGroupsView() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const list = useWorkGroups();
  const [isCreating, setIsCreating] = useState(false);

  const open = list.items.find((item) => item.group.id === groupId);
  const first = list.items[0];
  // No group in the address (or a deleted one): open the first, if any.
  const redirect =
    list.status === "ready" && !open && first
      ? workGroupPath(first.group.id)
      : list.status === "ready" && !open && groupId
        ? RoutePaths.settingsGroups
        : null;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageText}>
          <h2 className={styles.heading}>{WorkGroupsViewText.title}</h2>
          <p className={styles.muted}>{WorkGroupsViewText.description}</p>
        </div>
        <Button
          variant="primary"
          iconStart="add"
          onClick={() => setIsCreating(true)}
        >
          {WorkGroupsViewText.newGroup}
        </Button>
      </header>

      {redirect ? <Navigate to={redirect} replace /> : null}

      {list.status === "loading" ? (
        <div className={styles.loading}>
          <Spinner label={WorkGroupsViewText.loading} />
        </div>
      ) : list.status === "error" ? (
        <Banner tone="error">{DataErrorText[list.error ?? "unknown"]}</Banner>
      ) : list.items.length === 0 ? (
        <StatusPanel
          icon="members"
          title={WorkGroupsViewText.emptyTitle}
          headingLevel="h2"
          className={styles.empty}
        >
          <p>{WorkGroupsViewText.emptyBody}</p>
        </StatusPanel>
      ) : (
        <>
          <WorkGroupGrid items={list.items} hrefFor={workGroupPath} />
          {open ? <WorkGroupEditor key={open.group.id} item={open} /> : null}
        </>
      )}

      {isCreating ? (
        <NewWorkGroupDialog
          onClose={() => setIsCreating(false)}
          onCreated={(id) => {
            setIsCreating(false);
            navigate(workGroupPath(id));
          }}
        />
      ) : null}
    </div>
  );
}
