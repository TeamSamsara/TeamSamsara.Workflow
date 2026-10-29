// File : /TeamSamsara.Workflow/app/src/views/settings/roles/RolesView.tsx
// Version : 1.1.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Settings → Roles: the ordered role list on the left, and the open
// role on the right with its Display, Permissions and Members tabs, Reset and Save. The
// draft is shared by both tabs, and leaving the role with unsaved changes asks
// first.

import { useMutation } from "@tanstack/react-query";
import { useState, type CSSProperties } from "react";
import {
  Navigate,
  Outlet,
  useBlocker,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  NewRoleDialog,
  RoleList,
  saveRoleOrder,
  useRoleDraft,
  useRoleList,
  type RoleListItem,
  type RoleListState,
} from "@/features/roles";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { NavTabs } from "@/shared/components/Tabs/NavTabs";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoleTabs, rolePath } from "@/shared/constants/routePaths";
import type { RoleEditorContext } from "./roleEditorContext";
import { RolesViewText } from "./rolesViewContent";
import styles from "./RolesView.module.css";

// #region The open role
interface RoleEditorPanelProps {
  item: RoleListItem;
  list: RoleListState;
}

function RoleEditorPanel({ item, list }: RoleEditorPanelProps) {
  const draft = useRoleDraft(item.role);
  const toast = useToast();
  const roleId = item.role.id;
  const title = item.isEveryone
    ? item.role.name
    : RolesViewText.editTitle(item.role.name);

  // Switching tabs keeps the draft; going anywhere else with changes asks first.
  const blocker = useBlocker(
    ({ nextLocation }) =>
      draft.isDirty && !nextLocation.pathname.startsWith(rolePath(roleId)),
  );

  const tabs = item.isEveryone
    ? []
    : [
        {
          to: rolePath(roleId, RoleTabs.display),
          label: RolesViewText.tabs.display,
        },
        {
          to: rolePath(roleId, RoleTabs.permissions),
          label: RolesViewText.tabs.permissions,
        },
        {
          to: rolePath(roleId, RoleTabs.members),
          label:
            item.memberCount === null
              ? RolesViewText.tabs.members
              : RolesViewText.membersTab(item.memberCount),
        },
      ];

  function save() {
    const name = item.isEveryone ? item.role.name : draft.fields.name.trim();
    draft.save(() =>
      toast.show({ tone: "success", title: RolesViewText.saved(name) }),
    );
  }

  const context: RoleEditorContext = { item, draft, list };

  return (
    <section className={styles.editor} aria-labelledby={`role-${roleId}`}>
      <header className={styles.editorHeader}>
        <div className={styles.editorTitle}>
          <span
            className={styles.dot}
            style={{ "--role-color": draft.fields.color } as CSSProperties}
            aria-hidden="true"
          />
          <h2 id={`role-${roleId}`} className={styles.heading}>
            {title}
          </h2>
        </div>
        {item.canManage ? (
          <div className={styles.actions}>
            <Button
              variant="ghost"
              onClick={draft.reset}
              disabled={!draft.isDirty || draft.isSaving}
            >
              {RolesViewText.reset}
            </Button>
            <Button
              variant="primary"
              onClick={save}
              disabled={!draft.isDirty || Boolean(draft.nameError)}
              isLoading={draft.isSaving}
            >
              {RolesViewText.save}
            </Button>
          </div>
        ) : null}
      </header>

      {tabs.length ? (
        <NavTabs label={RolesViewText.tabsLabel} items={tabs} />
      ) : null}
      {draft.saveError ? <Banner tone="error">{draft.saveError}</Banner> : null}

      <Outlet context={context} />

      {blocker.state === "blocked" ? (
        <Modal
          title={RolesViewText.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {RolesViewText.discard.keep}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  draft.reset();
                  blocker.proceed();
                }}
              >
                {RolesViewText.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.text}>{RolesViewText.discard.body}</p>
        </Modal>
      ) : null}
    </section>
  );
}
// #endregion

export function RolesView() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const list = useRoleList();
  const [isCreating, setIsCreating] = useState(false);

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => saveRoleOrder(orderedIds),
    onError: () =>
      toast.show({ tone: "error", title: RolesViewText.orderFailed }),
  });

  if (list.status === "loading") {
    return (
      <div className={styles.loading}>
        <Spinner label={RolesViewText.loading} />
      </div>
    );
  }

  const open = list.items.find((item) => item.role.id === roleId);
  if (!roleId || !open) {
    const first = list.items[0];
    return first ? <Navigate to={rolePath(first.role.id)} replace /> : null;
  }

  // While a new order saves, show it straight away rather than snapping back.
  const pendingOrder = reorder.isPending ? reorder.variables : undefined;
  const items = pendingOrder
    ? [...list.items].sort((a, b) => {
        const rank = (item: RoleListItem) =>
          item.isEveryone ? Infinity : pendingOrder.indexOf(item.role.id);
        return rank(a) - rank(b);
      })
    : list.items;

  const canCreate = list.editor.permissions.has("manageRoles");

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{RolesViewText.title}</h2>
        <p className={styles.description}>{RolesViewText.description}</p>
      </header>

      <div className={styles.columns}>
        <RoleList
          items={items}
          firstMovableIndex={list.firstMovableIndex}
          hrefFor={(id) => rolePath(id)}
          onReorder={(orderedIds) => reorder.mutate(orderedIds)}
          isSaving={reorder.isPending}
          onNewRole={canCreate ? () => setIsCreating(true) : undefined}
          className={styles.list}
        />
        <RoleEditorPanel key={open.role.id} item={open} list={list} />
      </div>

      {isCreating ? (
        <NewRoleDialog
          onClose={() => setIsCreating(false)}
          onCreated={(id) => {
            setIsCreating(false);
            navigate(rolePath(id, RoleTabs.display));
          }}
        />
      ) : null}
    </div>
  );
}
