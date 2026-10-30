// File : /TeamSamsara.Workflow/app/src/views/settings/task-setup/TaskSetupView.tsx
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Settings → Tasks and events: the workspace's statuses, event types
// and tags. Statuses come with a starting set; event types and tags start
// empty, for each workspace to make its own.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { usePermissions } from "@/core/access";
import { Collections, type ColouredItem, type StatusRecord } from "@/core/data";
import {
  addStartingStatuses,
  ColouredItemDialog,
  saveSetupOrder,
  SetupListCard,
  startingStatus,
  StatusCategoryText,
  StatusDialog,
  StatusPill,
  TagChip,
  useEventTypes,
  useStatuses,
  useTags,
  type ColouredListName,
  type SetupListName,
} from "@/features/task-setup";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { useToast } from "@/shared/components/Toast/useToast";
import { TaskSetupViewText as Text } from "./taskSetupViewContent";
import styles from "./TaskSetupView.module.css";

type OpenDialog =
  | { kind: "status"; item: StatusRecord | null }
  | { kind: ColouredListName; item: ColouredItem | null }
  | null;

export function TaskSetupView() {
  const canChange = usePermissions().can("manageSettings");
  const toast = useToast();
  const statuses = useStatuses();
  const eventTypes = useEventTypes();
  const tags = useTags();
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const reorder = useMutation({
    mutationFn: ({ list, ids }: { list: SetupListName; ids: string[] }) =>
      saveSetupOrder(list, ids),
    onError: () => toast.show({ tone: "error", title: Text.orderFailed }),
  });
  const addStarting = useMutation({
    mutationFn: () => addStartingStatuses(statuses.items),
    onError: () =>
      toast.show({ tone: "error", title: Text.statuses.startingFailed }),
  });

  const firstOpen = startingStatus(statuses.items);
  const savingList = reorder.isPending ? reorder.variables.list : null;
  const failed = [statuses, eventTypes, tags].some(
    (list) => list.status === "error",
  );
  const readOnly = !canChange;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>{Text.title}</h2>
        <p className={styles.muted}>{Text.description}</p>
      </header>
      {failed ? <Banner tone="error">{Text.loadFailed}</Banner> : null}
      {readOnly ? <Banner tone="info">{Text.readOnly}</Banner> : null}

      <SetupListCard
        title={Text.statuses.title}
        description={Text.statuses.description}
        addLabel={Text.statuses.add}
        items={statuses.items}
        readOnly={readOnly}
        renderLabel={(status) => <StatusPill status={status} />}
        renderDetail={(status) => (
          <>
            {Text.statuses.countsAs(StatusCategoryText[status.category].label)}
            {status.id === firstOpen?.id ? (
              <span className={styles.starts}>
                {" "}
                · {Text.statuses.startsHere}
              </span>
            ) : null}
          </>
        )}
        onAdd={() => setDialog({ kind: "status", item: null })}
        onEdit={(item) => setDialog({ kind: "status", item })}
        onReorder={(ids) => reorder.mutate({ list: Collections.statuses, ids })}
        isSavingOrder={savingList === Collections.statuses}
        empty={
          <div className={styles.empty}>
            <p className={styles.muted}>{Text.statuses.empty}</p>
            {readOnly || statuses.status !== "ready" ? null : (
              <Button
                size="small"
                variant="primary"
                onClick={() => addStarting.mutate()}
                isLoading={addStarting.isPending}
              >
                {Text.statuses.addStarting}
              </Button>
            )}
          </div>
        }
      />

      <SetupListCard
        title={Text.eventTypes.title}
        description={Text.eventTypes.description}
        addLabel={Text.eventTypes.add}
        items={eventTypes.items}
        readOnly={readOnly}
        renderLabel={(item) => <TagChip item={item} />}
        onAdd={() => setDialog({ kind: "eventType", item: null })}
        onEdit={(item) => setDialog({ kind: "eventType", item })}
        onReorder={(ids) =>
          reorder.mutate({ list: Collections.eventTypes, ids })
        }
        isSavingOrder={savingList === Collections.eventTypes}
        empty={<p className={styles.muted}>{Text.eventTypes.empty}</p>}
      />

      <SetupListCard
        title={Text.tags.title}
        description={Text.tags.description}
        addLabel={Text.tags.add}
        items={tags.items}
        readOnly={readOnly}
        renderLabel={(item) => <TagChip item={item} />}
        onAdd={() => setDialog({ kind: "tag", item: null })}
        onEdit={(item) => setDialog({ kind: "tag", item })}
        onReorder={(ids) => reorder.mutate({ list: Collections.tags, ids })}
        isSavingOrder={savingList === Collections.tags}
        empty={<p className={styles.muted}>{Text.tags.empty}</p>}
      />

      {dialog?.kind === "status" ? (
        <StatusDialog
          status={dialog.item}
          statuses={statuses.items}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog && dialog.kind !== "status" ? (
        <ColouredItemDialog
          list={dialog.kind}
          item={dialog.item}
          items={dialog.kind === "tag" ? tags.items : eventTypes.items}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
