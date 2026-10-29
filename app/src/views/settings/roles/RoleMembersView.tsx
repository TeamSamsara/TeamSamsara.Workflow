// File : /TeamSamsara.Workflow/app/src/views/settings/roles/RoleMembersView.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A role's Members tab: who has it, with search, Remove per person,
// and Add members. Changes save straight away. Everyone has no Members tab.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { dataErrorMessage } from "@/core/data";
import {
  filterMembers,
  memberName,
  MemberPicker,
  useMembers,
} from "@/features/members";
import { giveRole, givableRoles, RoleChip, takeRole } from "@/features/roles";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { Table } from "@/shared/components/Table/Table";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoleTabs, rolePath } from "@/shared/constants/routePaths";
import { useRoleEditor } from "./roleEditorContext";
import { RoleMembersViewText } from "./roleMembersViewContent";
import styles from "./RolesView.module.css";

/** The narrowest the table gets before it scrolls sideways. */
const tableMinWidth = 460;

export function RoleMembersView() {
  const { item, list } = useRoleEditor();
  const members = useMembers();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const role = item.role;

  const onError = (error: unknown) =>
    toast.show({
      tone: "error",
      title: RoleMembersViewText.failed,
      detail: dataErrorMessage(error),
    });
  const give = useMutation({
    mutationFn: (memberIds: string[]) => giveRole(role.id, memberIds),
    onSuccess: (_result, memberIds) => {
      setIsPicking(false);
      toast.show({
        tone: "success",
        title: RoleMembersViewText.given(memberIds.length, role.name),
      });
    },
    onError,
  });
  const take = useMutation({
    mutationFn: ({ memberId }: { memberId: string; name: string }) =>
      takeRole(role.id, memberId),
    onSuccess: (_result, { name }) =>
      toast.show({
        tone: "success",
        title: RoleMembersViewText.taken(name, role.name),
      }),
    onError,
  });

  if (item.isEveryone) {
    return <Navigate to={rolePath(role.id, RoleTabs.permissions)} replace />;
  }

  const canChange =
    list.roles !== null &&
    givableRoles(list.roles, list.editor).some((other) => other.id === role.id);
  const holders = members.items.filter((entry) =>
    entry.member.roleIds.includes(role.id),
  );
  const others = members.items.filter(
    (entry) => !entry.member.roleIds.includes(role.id),
  );
  const shown = filterMembers(holders, "all", search);

  if (members.status === "loading") {
    return (
      <div className={styles.loading}>
        <Spinner label={RoleMembersViewText.loading} />
      </div>
    );
  }

  return (
    <>
      {canChange ? null : (
        <Banner tone="info" icon="lock">
          {RoleMembersViewText.locked}
        </Banner>
      )}
      <div className={styles.toolbar}>
        <TextField
          label={RoleMembersViewText.search}
          hideLabel
          type="search"
          leadingIcon="search"
          placeholder={RoleMembersViewText.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={styles.search}
        />
        {canChange ? (
          <Button iconStart="add" onClick={() => setIsPicking(true)}>
            {RoleMembersViewText.add}
          </Button>
        ) : null}
      </div>

      {holders.length === 0 ? (
        <p className={styles.muted}>{RoleMembersViewText.none}</p>
      ) : shown.length === 0 ? (
        <p className={styles.muted}>{RoleMembersViewText.noMatch}</p>
      ) : (
        <Table
          caption={RoleMembersViewText.caption(role.name)}
          minWidth={tableMinWidth}
        >
          <thead>
            <tr>
              <th scope="col">{RoleMembersViewText.member}</th>
              <th scope="col">{RoleMembersViewText.allRoles}</th>
              {canChange ? (
                <th scope="col" aria-label={RoleMembersViewText.remove} />
              ) : null}
            </tr>
          </thead>
          <tbody>
            {shown.map((entry) => {
              const name = memberName(entry.member);
              return (
                <tr key={entry.member.id}>
                  <td>
                    <span className={styles.person}>
                      <Avatar name={name} />
                      <span className={styles.personText}>
                        <b>{name}</b>
                        <span className={styles.muted}>
                          {entry.member.email}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className={styles.chips}>
                      {entry.roles.map((other) => (
                        <RoleChip key={other.id} role={other} />
                      ))}
                    </span>
                  </td>
                  {canChange ? (
                    <td className={styles.endCell}>
                      <Button
                        variant="ghost"
                        size="small"
                        aria-label={RoleMembersViewText.removeLabel(name)}
                        onClick={() =>
                          take.mutate({ memberId: entry.member.id, name })
                        }
                        disabled={take.isPending}
                      >
                        {RoleMembersViewText.remove}
                      </Button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {isPicking ? (
        <MemberPicker
          title={RoleMembersViewText.pickerTitle(role.name)}
          items={others}
          onPick={(memberIds) => give.mutate(memberIds)}
          onClose={() => setIsPicking(false)}
          isSaving={give.isPending}
        />
      ) : null}
    </>
  );
}
