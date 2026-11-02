// File : /TeamSamsara.Workflow/app/src/views/availability/MyAvailabilityView.tsx
// Version : 1.1.0
// Latest commit: feature/your-account
// Author : Gerrah
// Purpose : A member's availability: their usual week to paint, the dates that
// differ, and who sees it. Saved together with one button; leaving with
// unsaved changes asks first. Managers can switch to the team's.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useBlocker } from "react-router-dom";
import { usePermissions } from "@/core/access";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import { useDisplayTime, useWorkspaceRecord } from "@/core/workspace";
import {
  ExceptionsCard,
  MyAvailabilityText as Text,
  saveAvailability,
  useAvailability,
  WeekPainter,
  type AvailabilityException,
  type AvailabilityRecord,
} from "@/features/availability";
import { CalendarText } from "@/features/events";
import { formatClockTime } from "@/features/workflows";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Modal } from "@/shared/components/Modal/Modal";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { Spinner } from "@/shared/components/Spinner/Spinner";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { dayKey, formatDate } from "@/shared/time/dates";
import { timeZoneLabel } from "@/shared/time/timeZones";
import { dayKeyToDate } from "@/shared/time/monthGrid";
import { AvailabilityViewText } from "./availabilityViewContent";
import styles from "./AvailabilityViews.module.css";

function Editor({
  memberId,
  saved,
}: {
  memberId: string;
  saved: AvailabilityRecord | null;
}) {
  const workspace = useWorkspaceRecord();
  const time = useDisplayTime();
  const access = usePermissions();
  const toast = useToast();
  const now = useNow();
  const today = dayKey(now, time.timeZone);
  const [weekly, setWeekly] = useState<Record<number, number[]>>(
    saved?.weekly ?? {},
  );
  const [exceptions, setExceptions] = useState<AvailabilityException[]>(
    saved?.exceptions ?? [],
  );
  const [isDirty, setIsDirty] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      saveAvailability(
        memberId,
        weekly,
        exceptions.filter((exception) => exception.date >= today),
        time.timeZone,
      ),
    onSuccess: () => {
      setIsDirty(false);
      toast.show({ tone: "success", title: Text.saved });
    },
  });
  const blocker = useBlocker(() => isDirty && !save.isPending);

  const order =
    workspace.weekStartsOn === "monday"
      ? [1, 2, 3, 4, 5, 6, 0]
      : [0, 1, 2, 3, 4, 5, 6];
  const names = CalendarText.weekdays[workspace.weekStartsOn];
  const days = order.map((index, position) => ({
    index,
    name: names[position],
  }));
  const hourLabel = (hour: number) =>
    formatClockTime(
      `${String(hour).padStart(2, "0")}:00`,
      time.timeFormat,
    ).replace(":00", "");

  return (
    <>
      <PageHeader
        title={Text.title}
        breadcrumbs={[
          { label: AvailabilityViewText.calendar, to: RoutePaths.calendar },
          { label: Text.title },
        ]}
        description={Text.intro}
        actions={
          <>
            {access.can("viewAvailability") ? (
              <LinkButton to={RoutePaths.availabilityTeam} iconStart="members">
                {AvailabilityViewText.team}
              </LinkButton>
            ) : null}
            <Button
              variant="primary"
              onClick={() => save.mutate()}
              isLoading={save.isPending}
              disabled={!isDirty}
            >
              {Text.save}
            </Button>
          </>
        }
      />
      {save.error ? (
        <Banner tone="error">{dataErrorMessage(save.error)}</Banner>
      ) : null}
      <div className={styles.columns}>
        <section className={styles.main} aria-label={Text.title}>
          <WeekPainter
            weekly={weekly}
            onChange={(next) => {
              setWeekly(next);
              setIsDirty(true);
            }}
            days={days}
            hourLabel={hourLabel}
          />
          <p className={styles.muted}>
            {Text.zoneNote(timeZoneLabel(time.timeZone, now))}
          </p>
        </section>
        <div className={styles.side}>
          <ExceptionsCard
            exceptions={exceptions}
            onChange={(next) => {
              setExceptions(next);
              setIsDirty(true);
            }}
            dayLabel={(key) =>
              formatDate(dayKeyToDate(key), "UTC", time.dateFormat)
            }
            timeLabel={(clock) => formatClockTime(clock, time.timeFormat)}
            today={today}
          />
          <section className={styles.card} aria-labelledby="who-sees">
            <h2 id="who-sees" className={styles.weekTitle}>
              {Text.whoSees}
            </h2>
            <p className={styles.muted}>{Text.whoSeesBody}</p>
          </section>
        </div>
      </div>
      {blocker.state === "blocked" ? (
        <Modal
          title={Text.discard.title}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button onClick={() => blocker.reset()}>
                {Text.discard.keep}
              </Button>
              <Button variant="danger" onClick={() => blocker.proceed()}>
                {Text.discard.confirm}
              </Button>
            </>
          }
        >
          <p className={styles.muted}>{Text.discard.body}</p>
        </Modal>
      ) : null}
    </>
  );
}

export function MyAvailabilityView() {
  const session = useSession();
  const memberId = session.status === "active" ? session.member.id : null;
  const saved = useAvailability(memberId);

  return (
    <div className={styles.page}>
      {saved === undefined || !memberId ? (
        <div className={styles.loading}>
          <Spinner label={Text.loading} />
        </div>
      ) : (
        <Editor key={memberId} memberId={memberId} saved={saved} />
      )}
    </div>
  );
}
