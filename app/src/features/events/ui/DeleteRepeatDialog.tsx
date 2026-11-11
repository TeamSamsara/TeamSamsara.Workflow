// File : /TeamSamsara.Workflow/app/src/features/events/ui/DeleteRepeatDialog.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : Deleting a date of a repeat: just this one, this and every later
// one, or the whole series. Before anything goes it counts the events and
// their tasks, and offers to keep the finished tasks as history (on).

import { useMutation, useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Modal } from "@/shared/components/Modal/Modal";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey, formatDate } from "@/shared/time/dates";
import { dayKeyToDate } from "@/shared/time/monthGrid";
import { useSeesAllEvents } from "../hooks/useEvents";
import { describeRepeat } from "../model/repeatSummary";
import {
  planSeriesDeletion,
  SeriesChoices,
  type SeriesChoice,
} from "../model/seriesDeletion";
import { deleteSeries, readSeries } from "../service/repeatService";
import type { RepeatRecord } from "../types/repeatTypes";
import { DeleteRepeatText as Text } from "./deleteRepeatContent";
import styles from "./DeleteRepeatDialog.module.css";

interface DeleteRepeatDialogProps {
  repeat: RepeatRecord;
  /** The date of the event the menu was opened on. */
  date: string;
  onClose: () => void;
  /** Called when the event the page shows is gone. */
  onGone?: () => void;
}

export function DeleteRepeatDialog({
  repeat,
  date,
  onClose,
  onGone,
}: DeleteRepeatDialogProps) {
  const workspace = useWorkspaceRecord();
  const time = useDisplayTime();
  const seesAll = useSeesAllEvents();
  const toast = useToast();
  const today = dayKey(useNow(), workspace.timeZone);
  const name = useId();
  const [choice, setChoice] = useState<SeriesChoice>("one");
  const [keepDone, setKeepDone] = useState(true);
  const dayLabel = formatDate(dayKeyToDate(date), "UTC", time.dateFormat);

  const source = useQuery({
    queryKey: ["deleteSeries", repeat.id, choice, date, today],
    queryFn: () =>
      readSeries(repeat, choice, date, today, workspace.timeZone, seesAll),
    retry: false,
    staleTime: 0,
  });
  const plan = source.data
    ? planSeriesDeletion(
        source.data.events.map((event) => event.id),
        source.data.tasks,
        keepDone,
      )
    : null;

  const remove = useMutation({
    mutationFn: () => {
      if (!source.data) throw new Error("Not counted yet");
      return deleteSeries(repeat, choice, date, source.data, keepDone);
    },
    onSuccess: (count) => {
      toast.show({ tone: "success", title: Text.deleted(count) });
      onClose();
      onGone?.();
    },
  });
  const busy = remove.isPending;
  const eventCount = plan?.eventIds.length ?? 0;

  return (
    <Modal
      title={Text.title(repeat.title)}
      description={Text.intro(
        describeRepeat(
          repeat,
          time.timeFormat,
          time.dateFormat,
          workspace.weekStartsOn,
        ),
        dayLabel,
      )}
      onClose={busy ? undefined : onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {Text.cancel}
          </Button>
          <Button
            variant="danger"
            iconStart="trash"
            isLoading={busy}
            disabled={!plan || eventCount === 0}
            onClick={() => remove.mutate()}
          >
            {Text.confirm(eventCount)}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <fieldset className={styles.choices} disabled={busy}>
          <legend className={styles.legend}>{Text.choicesLabel}</legend>
          {SeriesChoices.map((value) => (
            <label
              key={value}
              className={styles.choice}
              data-on={choice === value || undefined}
            >
              <input
                type="radio"
                name={name}
                checked={choice === value}
                onChange={() => setChoice(value)}
              />
              <span className={styles.choiceText}>
                <b>{Text.choices[value].label}</b>
                <span className={styles.muted}>
                  {Text.choices[value].help(
                    value === "all" ? repeat.title : dayLabel,
                  )}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className={styles.count}>
          {source.isPending ? (
            <span className={styles.loading}>
              <Spinner label={null} />
              {Text.checking}
            </span>
          ) : source.error ? (
            <Banner tone="error">
              {Text.readFailed}: {dataErrorMessage(source.error)}
            </Banner>
          ) : plan && source.data ? (
            <>
              <b>{Text.summary(eventCount, plan.deleteTaskIds.length)}</b>
              <span className={styles.muted}>
                {Text.taskLine(source.data.tasks.length, plan.finished)}
              </span>
              {plan.finished > 0 ? (
                <Checkbox
                  label={Text.keepDone}
                  description={Text.keepDoneHelp(repeat.title, dayLabel)}
                  checked={keepDone}
                  onChange={(event) => setKeepDone(event.target.checked)}
                  disabled={busy}
                />
              ) : null}
            </>
          ) : null}
        </div>

        {remove.error ? (
          <Banner tone="error">
            {Text.failed}: {dataErrorMessage(remove.error)}
          </Banner>
        ) : null}
      </div>
    </Modal>
  );
}
