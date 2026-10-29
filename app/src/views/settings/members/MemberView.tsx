// File : /TeamSamsara.Workflow/app/src/views/settings/members/MemberView.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : One member's page: their name, roles and work groups (saved
// together with Save changes), what their roles let them do, and their access.
// An Administrator's page is read-only for anyone who isn't one.

import { Navigate, useBlocker, useNavigate, useParams } from "react-router-dom";
import { resolvePermissions, usePermissions } from "@/core/access";
import { EveryoneRoleId } from "@/core/data";
import { useSession } from "@/core/session";
import { useWorkspaceRecord } from "@/core/workspace";
import {
  MemberAccessCard,
  MemberGroupsCard,
  MemberHeader,
  memberName,
  MemberPermissionsCard,
  MemberRolesCard,
  useMember,
  useMemberDraft,
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
  const workspace = useWorkspaceRecord();
  const groups = useWorkGroups();
  const draft = useMemberDraft(member);
  const toast = useToast();
  const navigate = useNavigate();

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
  const targetIsAdmin = resolvePermissions(member.roleIds, roles).has(
    "administrator",
  );
  const locked = targetIsAdmin && !isAdministrator;
  const isSelf = session.status === "active" && session.user.id === member.id;
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
        timeZone={workspace.timeZone}
        actions={
          locked ? null : (
            <>
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
          {MemberViewText.lockedAdmin}
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
            groups={groups.items.map((entry) => entry.group)}
            onChange={(workGroupIds) => draft.change({ workGroupIds })}
            disabled={locked || draft.isSaving}
          />
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
