// File : /TeamSamsara.Workflow/app/src/views/settings/members/MemberView.tsx
// Version : 1.5.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : One member's page: their name, roles and work groups (saved
// together with Save changes), what their roles let them do, and their access.
// An Administrator's page is read-only for anyone who isn't one.

import { useMutation } from "@tanstack/react-query";
import { Navigate, useBlocker, useNavigate, useParams } from "react-router-dom";
import { OwnerRoleId, rankOf } from "@engine/access/index";
import { manage, usePermissions } from "@/core/access";
import { dataErrorMessage, EveryoneRoleId } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime } from "@/core/workspace";
import { PhotoText, removePhoto } from "@/features/account";
import {
  MemberAccessCard,
  MemberGroupsCard,
  MemberTagsCard,
  MemberHeader,
  memberName,
  MemberPermissionsCard,
  MemberRolesCard,
  useMember,
  useMemberDraft,
  useMembers,
  type MemberListItem,
} from "@/features/members";
import { givableRoles } from "@/features/roles";
import { useWorkGroups } from "@/features/work-groups";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Modal } from "@/shared/components/Modal/Modal";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths, memberPath } from "@/shared/constants/routePaths";
import { MemberViewText } from "./memberViewContent";
import styles from "./MemberView.module.css";

function MemberEditor({ item }: { item: MemberListItem }) {
  const { member } = item;
  const access = usePermissions();
  const session = useSession();
  const time = useDisplayTime();
  const groups = useWorkGroups();
  const draft = useMemberDraft(member);
  const toast = useToast();
  const navigate = useNavigate();
  const everyone = useMembers();
  const ownerChange = useMutation({
    mutationFn: (give: boolean) =>
      give
        ? manage({ op: "owner.give", memberId: member.id })
        : manage({ op: "owner.stepDown" }),
    onSuccess: (_result, give) =>
      toast.show({
        tone: "success",
        title: give
          ? MemberViewText.owner.given(memberName(member))
          : MemberViewText.owner.steppedDown,
      }),
    onError: (error) =>
      toast.show({ tone: "error", title: dataErrorMessage(error) }),
  });
  const takeDownPhoto = useMutation({
    mutationFn: () => removePhoto(member.id, member.photoUrl),
    onSuccess: () => toast.show({ tone: "success", title: PhotoText.removed }),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: PhotoText.removeFailed,
        detail: dataErrorMessage(error),
      }),
  });

  const blocker = useBlocker(
    ({ nextLocation }) =>
      draft.isDirty && nextLocation.pathname !== memberPath(member.id),
  );

  const roles = access.roles;
  if (!roles) return null;

  const editor = {
    memberRoleIds: access.memberRoleIds,
    permissions: access.permissions,
  };
  const isAdministrator = access.can("administrator");
  const isSelf = session.status === "active" && session.user.id === member.id;
  // Strictly below: nobody changes their own record here, or anyone at or above them.
  const myRank = rankOf(access.memberRoleIds, roles.roles);
  const locked = isSelf || rankOf(member.roleIds, roles.roles) >= myRank;
  const iAmOwner = access.memberRoleIds.includes(OwnerRoleId);
  const targetIsOwner = member.roleIds.includes(OwnerRoleId);
  const otherOwners = everyone.records.filter(
    (entry) =>
      entry.id !== member.id &&
      entry.status !== "removed" &&
      entry.roleIds.includes(OwnerRoleId),
  ).length;
  const name = memberName({
    displayName: draft.details.displayName,
    email: member.email,
  });
  // In sentences, a member without a name is "they" rather than their email.
  const sentenceName = draft.details.displayName.trim() || null;

  function save() {
    draft.save(() =>
      toast.show({ tone: "success", title: MemberViewText.saved(name) }),
    );
  }

  return (
    <>
      <MemberHeader
        member={member}
        displayName={draft.details.displayName}
        onNameChange={(displayName) => draft.change({ displayName })}
        nameError={draft.nameError}
        canEditName={!locked}
        timeZone={time.timeZone}
        actions={
          locked ? null : (
            <>
              {/* Administrators can take down someone else's photo. */}
              {isAdministrator && member.photoUrl ? (
                <Button
                  variant="ghost"
                  iconStart="trash"
                  isLoading={takeDownPhoto.isPending}
                  onClick={() => takeDownPhoto.mutate()}
                >
                  {PhotoText.remove}
                </Button>
              ) : null}
              <Button
                variant="ghost"
                onClick={draft.reset}
                disabled={!draft.isDirty || draft.isSaving}
              >
                {MemberViewText.reset}
              </Button>
              <Button
                variant="primary"
                onClick={save}
                disabled={!draft.isDirty || Boolean(draft.nameError)}
                isLoading={draft.isSaving}
              >
                {MemberViewText.save}
              </Button>
            </>
          )
        }
      />

      {locked ? (
        <Banner tone="info" icon="lock">
          {isSelf ? MemberViewText.lockedSelf : MemberViewText.lockedRank}
        </Banner>
      ) : null}
      {draft.saveError ? <Banner tone="error">{draft.saveError}</Banner> : null}

      <div className={styles.columns}>
        <div className={styles.main}>
          <MemberRolesCard
            name={sentenceName}
            roleIds={draft.details.roleIds}
            allRoles={roles.roles}
            assignable={locked ? [] : givableRoles(roles, editor)}
            everyone={roles.roles.find((role) => role.id === EveryoneRoleId)}
            onChange={(roleIds) => draft.change({ roleIds })}
            disabled={draft.isSaving}
          />
          <MemberGroupsCard
            workGroupIds={draft.details.workGroupIds}
            groups={groups.items}
            onChange={(workGroupIds) => draft.change({ workGroupIds })}
            disabled={locked || draft.isSaving}
          />
          <MemberTagsCard member={member} name={name} />
          {iAmOwner && (isSelf || !targetIsOwner) ? (
            <section
              className={styles.ownerCard}
              aria-labelledby="member-owner"
            >
              <h2 id="member-owner" className={styles.ownerTitle}>
                {MemberViewText.owner.title}
              </h2>
              {isSelf ? (
                <>
                  <p className={styles.ownerHelp}>
                    {otherOwners > 0
                      ? MemberViewText.owner.stepDownHelp
                      : MemberViewText.owner.lastOwner}
                  </p>
                  <Button
                    onClick={() => ownerChange.mutate(false)}
                    disabled={otherOwners === 0}
                    isLoading={ownerChange.isPending}
                  >
                    {MemberViewText.owner.stepDown}
                  </Button>
                </>
              ) : (
                <>
                  <p className={styles.ownerHelp}>
                    {MemberViewText.owner.giveHelp}
                  </p>
                  <Button
                    onClick={() => ownerChange.mutate(true)}
                    disabled={
                      member.status !== "active" && member.status !== "invited"
                    }
                    isLoading={ownerChange.isPending}
                  >
                    {MemberViewText.owner.give(memberName(member))}
                  </Button>
                </>
              )}
            </section>
          ) : targetIsOwner ? (
            <Banner tone="info" icon="lock">
              {MemberViewText.owner.isOwner(memberName(member))}
            </Banner>
          ) : null}
          <MemberAccessCard
            member={member}
            isSelf={isSelf}
            locked={locked}
            onRemoved={() => {
              draft.reset();
              navigate(RoutePaths.settingsMembers, { replace: true });
            }}
          />
        </div>
        <div className={styles.side}>
          <MemberPermissionsCard
            name={sentenceName}
            roleIds={draft.details.roleIds}
            roles={roles}
          />
        </div>
      </div>

      {blocker.state === "blocked" ? (
        <Modal
          title={MemberViewText.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {MemberViewText.discard.keep}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  draft.reset();
                  blocker.proceed();
                }}
              >
                {MemberViewText.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{MemberViewText.discard.body}</p>
        </Modal>
      ) : null}
    </>
  );
}

export function MemberView() {
  const { memberId } = useParams();
  const item = useMember(memberId);

  return (
    <div className={styles.page}>
      <LinkButton
        to={RoutePaths.settingsMembers}
        variant="ghost"
        iconStart="back"
        className={styles.back}
      >
        {MemberViewText.back}
      </LinkButton>
      {item === undefined ? (
        <div className={styles.loading}>
          <Spinner label={MemberViewText.loading} />
        </div>
      ) : item === null ? (
        <Navigate to={RoutePaths.settingsMembers} replace />
      ) : (
        <MemberEditor key={item.member.id} item={item} />
      )}
    </div>
  );
}
