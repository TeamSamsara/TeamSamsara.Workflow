// File : /TeamSamsara.Workflow/app/src/views/settings/members/MembersView.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Settings → Members: everyone in the workspace with search and a
// status filter, and Invite people.

import { useState } from "react";
import { DataErrorText } from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import {
  countByStatus,
  filterMembers,
  InviteDialog,
  MembersTable,
  StatusFilters,
  useMembers,
  type StatusFilter,
} from "@/features/members";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { memberPath } from "@/shared/constants/routePaths";
import { MembersViewText } from "./membersViewContent";
import styles from "./MembersView.module.css";

export function MembersView() {
  const workspace = useWorkspaceRecord();
  const members = useMembers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [isInviting, setIsInviting] = useState(false);

  const counts = countByStatus(members.items);
  const filterOptions = StatusFilters.map((value) => ({
    value,
    label: MembersViewText.filterWithCount(
      MembersViewText.filters[value],
      counts[value],
    ),
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{MembersViewText.title}</h2>
          <p className={styles.muted}>{MembersViewText.description}</p>
        </div>
        <Button
          variant="primary"
          iconStart="invite"
          onClick={() => setIsInviting(true)}
        >
          {MembersViewText.invite}
        </Button>
      </header>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <TextField
            label={MembersViewText.search}
            hideLabel
            type="search"
            leadingIcon="search"
            placeholder={MembersViewText.search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={styles.search}
          />
          <SegmentedControl
            label={MembersViewText.filterLabel}
            options={filterOptions}
            value={filter}
            onChange={setFilter}
          />
        </div>

        {members.status === "loading" ? (
          <div className={styles.loading}>
            <Spinner label={MembersViewText.loading} />
          </div>
        ) : members.status === "error" ? (
          <Banner tone="error">
            {DataErrorText[members.error ?? "unknown"]}
          </Banner>
        ) : (
          <MembersTable
            items={filterMembers(members.items, filter, search)}
            hrefFor={memberPath}
            timeZone={workspace.timeZone}
          />
        )}
      </section>

      {isInviting ? (
        <InviteDialog onClose={() => setIsInviting(false)} />
      ) : null}
    </div>
  );
}
