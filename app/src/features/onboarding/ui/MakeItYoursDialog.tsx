// File : /TeamSamsara.Workflow/app/src/features/onboarding/ui/MakeItYoursDialog.tsx
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : The walkthrough's last step: your name and in-game name (with how
// others will see you), your time zone (offering this device's), date format
// and clock. Saves like Your account; "Save and paint my usual week" then opens
// My availability.

import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  dataErrorMessage,
  DateFormats,
  TimeFormats,
  type DateFormat,
  type MemberRecord,
  type TimeFormat,
} from "@/core/data";
import { useWorkspaceRecord } from "@/core/workspace";
import { AccountLimits, saveAccount } from "@/features/account";
import { useAvailability } from "@/features/availability";
import { memberName, memberSubName } from "@/features/members";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { formatDate } from "@/shared/time/dates";
import {
  deviceTimeZone,
  timeZoneOptions,
  zoneCity,
} from "@/shared/time/timeZones";
import { MakeItYoursText as Text } from "./onboardingContent";
import styles from "./OnboardingDialogs.module.css";

interface MakeItYoursDialogProps {
  member: MemberRecord;
  /** saved: they saved (and maybe want to paint their week). */
  onDone: (result: "later" | "saved" | "paint") => void;
}

const example = new Date(Date.UTC(2026, 11, 15, 0, 0));

export function MakeItYoursDialog({ member, onDone }: MakeItYoursDialogProps) {
  const workspace = useWorkspaceRecord();
  const availability = useAvailability(member.id);
  const zones = useMemo(() => timeZoneOptions(), []);
  const device = deviceTimeZone();
  const [displayName, setDisplayName] = useState(member.displayName);
  const [gameName, setGameName] = useState(member.gameName ?? "");
  const [timeZone, setTimeZone] = useState(member.timeZone ?? "");
  const [dateFormat, setDateFormat] = useState<DateFormat | "">(
    member.dateFormat ?? "",
  );
  const [timeFormat, setTimeFormat] = useState<TimeFormat | "">(
    member.timeFormat ?? "",
  );
  const [tried, setTried] = useState(false);
  const nameProblem = displayName.trim() ? undefined : Text.nameRequired;
  const shownZone = timeZone || workspace.timeZone;
  const preview = { ...member, displayName, gameName };

  const save = useMutation<void, Error, "saved" | "paint">({
    mutationFn: () =>
      saveAccount(
        member.id,
        {
          displayName,
          gameName,
          timeZone: timeZone || null,
          dateFormat: dateFormat || null,
          timeFormat: timeFormat || null,
        },
        availability?.timeZone ?? null,
        shownZone,
      ),
    onSuccess: (_result, then) => onDone(then),
  });

  function submit(then: "saved" | "paint") {
    setTried(true);
    if (!nameProblem) save.mutate(then);
  }

  return (
    <Modal
      title={Text.title}
      description={Text.later}
      size="wide"
      onClose={save.isPending ? undefined : () => onDone("later")}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => onDone("later")}
            disabled={save.isPending}
          >
            {Text.skip}
          </Button>
          <Button onClick={() => submit("saved")} disabled={save.isPending}>
            {Text.save}
          </Button>
          <Button
            variant="primary"
            onClick={() => submit("paint")}
            isLoading={save.isPending}
          >
            {Text.saveAndPaint}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {save.error ? (
          <Banner tone="error">
            {Text.failed}: {dataErrorMessage(save.error)}
          </Banner>
        ) : null}
        <div className={styles.row}>
          <TextField
            label={Text.name}
            value={displayName}
            maxLength={AccountLimits.name}
            autoComplete="name"
            onChange={(event) => setDisplayName(event.target.value)}
            error={tried ? nameProblem : undefined}
            autoFocus
          />
          <TextField
            label={Text.gameName}
            hint={Text.optional}
            value={gameName}
            maxLength={AccountLimits.gameName}
            onChange={(event) => setGameName(event.target.value)}
          />
        </div>
        <div className={styles.preview}>
          <Avatar name={memberName(preview)} />
          <span className={styles.previewNames}>
            <b>{memberName(preview)}</b>
            {memberSubName(preview) ? (
              <span className={styles.muted}>{memberSubName(preview)}</span>
            ) : null}
          </span>
          <span className={styles.previewLabel}>{Text.preview}</span>
        </div>
        <div className={styles.row}>
          <div className={styles.zone}>
            <Select
              label={Text.timeZone}
              options={[
                {
                  value: "",
                  label: Text.sameAsWorkspace(zoneCity(workspace.timeZone)),
                },
                ...zones,
              ]}
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
            />
            {device !== shownZone ? (
              <span className={styles.muted}>
                {Text.device(zoneCity(device))}{" "}
                <button
                  type="button"
                  className={styles.link}
                  onClick={() =>
                    setTimeZone(device === workspace.timeZone ? "" : device)
                  }
                >
                  {Text.offerDevice(zoneCity(device))}
                </button>
              </span>
            ) : null}
          </div>
          <Select
            label={Text.dates}
            options={[
              {
                value: "",
                label: Text.sameAsWorkspace(
                  formatDate(example, "UTC", workspace.dateFormat),
                ),
              },
              ...DateFormats.map((value) => ({
                value,
                label: formatDate(example, "UTC", value),
              })),
            ]}
            value={dateFormat}
            onChange={(event) =>
              setDateFormat(
                DateFormats.find((value) => value === event.target.value) ?? "",
              )
            }
          />
          <Select
            label={Text.clock}
            options={[
              {
                value: "",
                label: Text.sameAsWorkspace(Text.clocks[workspace.timeFormat]),
              },
              ...TimeFormats.map((value) => ({
                value,
                label: Text.clocks[value],
              })),
            ]}
            value={timeFormat}
            onChange={(event) =>
              setTimeFormat(
                TimeFormats.find((value) => value === event.target.value) ?? "",
              )
            }
          />
        </div>
        {shownZone !== workspace.timeZone ? (
          <p className={styles.good}>
            {Text.note(zoneCity(workspace.timeZone))}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
