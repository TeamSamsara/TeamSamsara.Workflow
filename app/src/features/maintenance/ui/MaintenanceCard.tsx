// File : /TeamSamsara.Workflow/app/src/features/maintenance/ui/MaintenanceCard.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Settings › General, for Administrators: the weekly check-up's
// Apply switch, Run now, and the latest reports with their counts and a few
// examples of what they found.

import { useMutation } from "@tanstack/react-query";
import { dataErrorMessage } from "@/core/data";
import { useDisplayTime } from "@/core/workspace";
import { Button } from "@/shared/components/Button/Button";
import { Switch } from "@/shared/components/Fields/Switch/Switch";
import { Pill } from "@/shared/components/Pill/Pill";
import { useToast } from "@/shared/components/Toast/useToast";
import { formatDate, formatTime } from "@/shared/time/dates";
import { useMaintenance } from "../hooks/useMaintenance";
import { runCheckUp, setApply } from "../service/maintenanceService";
import { MaintenanceText as Text } from "./maintenanceContent";
import styles from "./MaintenanceCard.module.css";

function countLabel(key: string, count: number): string {
  const [collection, kind] = key.split(".");
  return `${count} ${Text.collections[collection] ?? collection} ${Text.kinds[kind] ?? kind}`;
}

export function MaintenanceCard() {
  const toast = useToast();
  const time = useDisplayTime();
  const state = useMaintenance(true);
  const run = useMutation({
    mutationFn: runCheckUp,
    onSuccess: (result) =>
      toast.show({
        tone: "success",
        title: Text.ran(result.total, result.files, result.mode === "apply"),
      }),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.runFailed,
        detail: dataErrorMessage(error),
      }),
  });
  const toggle = useMutation({
    mutationFn: setApply,
    onError: (error) =>
      toast.show({
        tone: "error",
        title: Text.saveFailed,
        detail: dataErrorMessage(error),
      }),
  });

  return (
    <section className={styles.card} aria-labelledby="maintenance-title">
      <div className={styles.head}>
        <h2 id="maintenance-title" className={styles.title}>
          {Text.title}
        </h2>
        <Button
          size="small"
          iconStart="reset"
          onClick={() => run.mutate()}
          isLoading={run.isPending}
        >
          {Text.runNow}
        </Button>
      </div>
      <p className={styles.muted}>{Text.description}</p>
      <Switch
        label={Text.apply}
        description={Text.applyHelp}
        checked={
          toggle.isPending ? (toggle.variables ?? state.apply) : state.apply
        }
        onCheckedChange={(checked) => toggle.mutate(checked)}
      />
      <h3 className={styles.subtitle}>{Text.lastRuns}</h3>
      {state.runs.length === 0 ? (
        <p className={styles.muted}>{Text.never}</p>
      ) : (
        <ul className={styles.runs}>
          {state.runs.map((entry) => (
            <li key={entry.id} className={styles.run}>
              <span className={styles.runHead}>
                <b>
                  {entry.at
                    ? `${formatDate(entry.at, time.timeZone, time.dateFormat)} ${formatTime(entry.at, time.timeZone, time.timeFormat)}`
                    : "…"}
                </b>
                <Pill tone={entry.mode === "apply" ? "success" : "neutral"}>
                  {Text.mode[entry.mode]}
                </Pill>
                <span className={styles.muted}>
                  {Text.trigger[entry.trigger] ?? entry.trigger}
                </span>
              </span>
              {entry.total === 0 && entry.files.count === 0 ? (
                <span className={styles.muted}>{Text.clean}</span>
              ) : (
                <ul className={styles.counts}>
                  {Object.entries(entry.counts).map(([key, count]) => (
                    <li key={key}>
                      {countLabel(key, count)}
                      {entry.examples[key]?.length ? (
                        <span className={styles.examples}>
                          {entry.examples[key].join(" · ")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                  {entry.files.count > 0 ? (
                    <li>
                      {Text.files(entry.files.count)}
                      <span className={styles.examples}>
                        {entry.files.examples.join(" · ")}
                      </span>
                    </li>
                  ) : null}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
