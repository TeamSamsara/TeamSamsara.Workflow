// File : /TeamSamsara.Workflow/app/src/features/maintenance/ui/PlatformUpdatesCard.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Platform updates on Settings › General, for Administrators: each
// update with when it ran and what it changed, or (pending) what it would
// change, and Apply now for the pending ones. They also run by themselves
// shortly after a release; in the local emulators this is how to run them.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { useDisplayTime } from "@/core/workspace";
import { Button } from "@/shared/components/Button/Button";
import { Pill } from "@/shared/components/Pill/Pill";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { formatDate, formatTime } from "@/shared/time/dates";
import { platformUpdates, type UpdateRow } from "../service/maintenanceService";
import { PlatformUpdatesText as Text } from "./maintenanceContent";
import styles from "./MaintenanceCard.module.css";

const shownNotes = 8;

export function PlatformUpdatesCard() {
  const toast = useToast();
  const time = useDisplayTime();
  const [rows, setRows] = useState<UpdateRow[] | null>(null);
  const run = useMutation({
    mutationFn: platformUpdates,
    onSuccess: (updates, action) => {
      if (action === "apply") {
        const before = rows?.filter((row) => !row.appliedAt).length ?? 0;
        const after = updates.filter((row) => !row.appliedAt).length;
        toast.show({ tone: "success", title: Text.applied(before - after) });
      }
      setRows(updates);
    },
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.failed,
        detail: dataErrorMessage(error),
      }),
  });
  const pending = rows?.filter((row) => !row.appliedAt).length ?? 0;
  const when = (iso: string) => {
    const date = new Date(iso);
    return `${formatDate(date, time.timeZone, time.dateFormat)} ${formatTime(date, time.timeZone, time.timeFormat)}`;
  };

  return (
    <section className={styles.card} aria-labelledby="updates-title">
      <div className={styles.head}>
        <h2 id="updates-title" className={styles.title}>
          {Text.title}
        </h2>
        {pending > 0 ? (
          <Button
            size="small"
            variant="primary"
            onClick={() => run.mutate("apply")}
            isLoading={run.isPending && run.variables === "apply"}
            disabled={run.isPending}
          >
            {Text.apply}
          </Button>
        ) : (
          <Button
            size="small"
            iconStart="reset"
            onClick={() => run.mutate("check")}
            isLoading={run.isPending && run.variables === "check"}
            disabled={run.isPending}
          >
            {Text.check}
          </Button>
        )}
      </div>
      <p className={styles.muted}>{Text.description}</p>
      {run.isPending && !rows ? (
        <Spinner label={Text.checking} />
      ) : !rows ? (
        <p className={styles.muted}>{Text.notChecked}</p>
      ) : (
        <ul className={styles.runs}>
          {rows.map((row) => (
            <li key={row.id} className={styles.run}>
              <span className={styles.runHead}>
                <b>{row.title}</b>
                <Pill tone={row.appliedAt ? "success" : "neutral"}>
                  {row.appliedAt ? Text.done : Text.pending}
                </Pill>
                {row.appliedAt ? (
                  <span className={styles.muted}>{when(row.appliedAt)}</span>
                ) : null}
              </span>
              {row.report ? (
                <ul className={styles.counts}>
                  <li>{row.report.summary}</li>
                  {row.report.notes.slice(0, shownNotes).map((note) => (
                    <li key={note} className={styles.examples}>
                      {note}
                    </li>
                  ))}
                  {row.report.notes.length > shownNotes ? (
                    <li className={styles.examples}>
                      {Text.more(row.report.notes.length - shownNotes)}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
