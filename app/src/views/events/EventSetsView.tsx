// File : /TeamSamsara.Workflow/app/src/views/events/EventSetsView.tsx
// Version : 1.0.0
// Latest commit: feature/event-sets
// Author : Gerrah
// Purpose : Every set of events (a split, a month of content), newest first,
// each opening its page; planners start a new one from here.

import { usePermissions } from "@/core/access";
import { DataErrorText } from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import { SetText as Text, useEventSets } from "@/features/events";
import { memberName, useMembers } from "@/features/members";
import { useEventTypes } from "@/features/task-setup";
import { Banner } from "@/shared/components/Banner/Banner";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Chip } from "@/shared/components/Chip/Chip";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { Table } from "@/shared/components/Table/Table";
import {
  eventSetPath,
  planSeveralPath,
  RoutePaths,
} from "@/shared/constants/routePaths";
import { formatDate } from "@/shared/time/dates";
import { Link } from "react-router-dom";
import styles from "./EventViews.module.css";
import plan from "./PlanViews.module.css";

export function EventSetsView() {
  const access = usePermissions();
  const workspace = useWorkspaceRecord();
  const sets = useEventSets();
  const members = useMembers();
  const eventTypes = useEventTypes();

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.sets}
        description={Text.setsDescription}
        breadcrumbs={[
          { label: Text.calendar, to: RoutePaths.calendar },
          { label: Text.sets },
        ]}
        actions={
          access.can("planEvents") ? (
            <LinkButton
              to={planSeveralPath()}
              variant="primary"
              iconStart="add"
            >
              {Text.newSet}
            </LinkButton>
          ) : null
        }
      />
      {sets.status === "error" ? (
        <Banner tone="error">{DataErrorText[sets.error ?? "unknown"]}</Banner>
      ) : sets.status === "loading" ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : sets.items.length === 0 ? (
        <p className={plan.empty}>{Text.noSets}</p>
      ) : (
        <div className={plan.tableCard}>
          <Table caption={Text.setsCaption} minWidth={560}>
            <thead>
              <tr>
                <th>{Text.name}</th>
                <th>{Text.type}</th>
                <th>{Text.madeBy}</th>
                <th>{Text.made}</th>
              </tr>
            </thead>
            <tbody>
              {sets.items.map((set) => {
                const type = eventTypes.items.find(
                  (entry) => entry.id === set.eventTypeId,
                );
                const maker = members.records.find(
                  (entry) => entry.id === set.createdBy,
                );
                return (
                  <tr key={set.id}>
                    <td>
                      <Link to={eventSetPath(set.id)} className={plan.setLink}>
                        {set.name}
                      </Link>
                    </td>
                    <td>
                      {type ? (
                        <Chip label={type.name} color={type.color} />
                      ) : (
                        <span className={plan.muted}>{Text.noType}</span>
                      )}
                    </td>
                    <td>{maker ? memberName(maker) : ""}</td>
                    <td className={plan.muted}>
                      {set.createdAt
                        ? formatDate(
                            set.createdAt,
                            workspace.timeZone,
                            workspace.dateFormat,
                          )
                        : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
