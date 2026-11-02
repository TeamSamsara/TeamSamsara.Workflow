// File : /TeamSamsara.Workflow/app/src/views/account/AccountView.tsx
// Version : 1.3.0
// Latest commit: fix/modal-and-account-notifications
// Author : Gerrah
// Purpose : Your account: who you are (name, in-game name, email), how you see
// times and dates (your own time zone, date format and clock, or the
// workspace's; your theme), your password, and signing out.

import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePermissions } from "@/core/access";
import {
  dataErrorMessage,
  DateFormats,
  TimeFormats,
  type DateFormat,
  type MemberRecord,
  type TimeFormat,
} from "@/core/data";
import { signOut, useSession } from "@/core/session";
import { ThemeChoices, useTheme, type ThemeChoice } from "@/core/theme";
import { useWorkspaceRecord } from "@/core/workspace";
import { AccountLimits, saveAccount } from "@/features/account";
import { ChangePasswordForm } from "@/features/auth";
import { useAvailability } from "@/features/availability";
import { memberName, memberSubName } from "@/features/members";
import {
  accountNotificationsId,
  NotificationSettingsForm,
  signOutEverywhere,
  useNotificationSettings,
} from "@/features/notifications";
import { useWalkthrough } from "@/features/onboarding";
import { useWorkGroups } from "@/features/work-groups";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { LinkButton } from "@/shared/components/Button/LinkButton";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths } from "@/shared/constants/routePaths";
import { useNow } from "@/shared/hooks/useNow";
import { formatDate, formatTime } from "@/shared/time/dates";
import {
  deviceTimeZone,
  timeZoneOptions,
  zoneCity,
} from "@/shared/time/timeZones";
import { AccountViewText as Text } from "./accountViewContent";
import styles from "./AccountView.module.css";

interface Draft {
  displayName: string;
  gameName: string;
  /** "" is the workspace's. */
  timeZone: string;
  dateFormat: DateFormat | "";
  timeFormat: TimeFormat | "";
}

const draftOf = (member: MemberRecord): Draft => ({
  displayName: member.displayName,
  gameName: member.gameName ?? "",
  timeZone: member.timeZone ?? "",
  dateFormat: member.dateFormat ?? "",
  timeFormat: member.timeFormat ?? "",
});

/** An example moment for the format choices: 7 PM on Dec 14. */
const example = new Date(Date.UTC(2026, 11, 15, 0, 0));

function Account({ member }: { member: MemberRecord }) {
  const workspace = useWorkspaceRecord();
  const access = usePermissions();
  const groups = useWorkGroups();
  const theme = useTheme();
  const toast = useToast();
  const now = useNow();
  const availability = useAvailability(member.id);
  const walkthrough = useWalkthrough();
  const [draft, setDraft] = useState<Draft>(() => draftOf(member));
  const [tried, setTried] = useState(false);
  const zones = useMemo(() => timeZoneOptions(), []);
  const device = deviceTimeZone();

  const saved = draftOf(member);
  const isDirty = (Object.keys(draft) as (keyof Draft)[]).some(
    (key) => draft[key] !== saved[key],
  );
  const nameProblem = draft.displayName.trim() ? undefined : Text.nameRequired;
  const shownZone = draft.timeZone || workspace.timeZone;
  const clock = draft.timeFormat || workspace.timeFormat;
  const change = (changes: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const notificationSettings = useNotificationSettings();
  const { hash } = useLocation();
  // The bell's gear links here with #notifications: go to that part.
  useEffect(() => {
    if (!hash || !notificationSettings) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [hash, notificationSettings]);
  const everywhere = useMutation({
    mutationFn: async () => {
      await signOutEverywhere();
      await signOut();
    },
  });

  const save = useMutation({
    mutationFn: () =>
      saveAccount(
        member.id,
        {
          displayName: draft.displayName,
          gameName: draft.gameName,
          timeZone: draft.timeZone || null,
          dateFormat: draft.dateFormat || null,
          timeFormat: draft.timeFormat || null,
        },
        availability?.timeZone ?? null,
        shownZone,
      ),
    onSuccess: () => toast.show({ tone: "success", title: Text.saved }),
  });

  const roleNames = (access.roles?.roles ?? [])
    .filter((role) => member.roleIds.includes(role.id))
    .map((role) => role.name);
  const groupNames = groups.items
    .filter((item) => member.workGroupIds.includes(item.group.id))
    .map((item) => item.group.name);
  const preview = {
    ...member,
    displayName: draft.displayName,
    gameName: draft.gameName,
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title={Text.title}
        description={Text.description}
        actions={
          <Button variant="ghost" iconStart="logOut" onClick={() => signOut()}>
            {Text.signOut}
          </Button>
        }
      />

      <div className={styles.who}>
        <Avatar name={memberName(preview)} />
        <span className={styles.names}>
          <b className={styles.name}>{memberName(preview)}</b>
          {memberSubName(preview) ? (
            <span className={styles.muted}>{memberSubName(preview)}</span>
          ) : null}
          <span className={styles.muted}>
            {[...roleNames, ...groupNames].join(" · ") || Text.noRoles}
          </span>
        </span>
      </div>

      {save.error ? (
        <Banner tone="error">
          {Text.failed}: {dataErrorMessage(save.error)}
        </Banner>
      ) : null}

      <section className={styles.card} aria-labelledby="account-you">
        <h2 id="account-you" className={styles.cardTitle}>
          {Text.you}
        </h2>
        <div className={styles.row}>
          <TextField
            label={Text.name}
            value={draft.displayName}
            maxLength={AccountLimits.name}
            autoComplete="name"
            onChange={(event) => change({ displayName: event.target.value })}
            error={tried ? nameProblem : undefined}
            className={styles.wide}
          />
          <TextField
            label={Text.gameName}
            hint={Text.optional}
            help={Text.gameNameHelp}
            value={draft.gameName}
            maxLength={AccountLimits.gameName}
            onChange={(event) => change({ gameName: event.target.value })}
            className={styles.wide}
          />
          <TextField
            label={Text.email}
            value={member.email}
            readOnly
            hint={Text.emailHint}
            className={styles.wide}
          />
        </div>
      </section>

      <section className={styles.card} aria-labelledby="account-time">
        <h2 id="account-time" className={styles.cardTitle}>
          {Text.time}
        </h2>
        <p className={styles.muted}>
          {Text.timeIntro(zoneCity(workspace.timeZone))}
        </p>
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
              value={draft.timeZone}
              onChange={(event) => change({ timeZone: event.target.value })}
            />
            <span className={styles.note}>
              {shownZone === workspace.timeZone
                ? Text.nowSame(formatTime(now, shownZone, clock))
                : Text.nowBoth(
                    formatTime(now, shownZone, clock),
                    formatTime(now, workspace.timeZone, clock),
                    zoneCity(workspace.timeZone),
                  )}
              {device !== shownZone ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() =>
                      change({
                        timeZone: device === workspace.timeZone ? "" : device,
                      })
                    }
                  >
                    {Text.deviceZone(zoneCity(device))}
                  </button>
                </>
              ) : null}
            </span>
          </div>
          <Select
            label={Text.dateFormat}
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
            value={draft.dateFormat}
            onChange={(event) =>
              change({
                dateFormat:
                  DateFormats.find((value) => value === event.target.value) ??
                  "",
              })
            }
            className={styles.narrow}
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
            value={draft.timeFormat}
            onChange={(event) =>
              change({
                timeFormat:
                  TimeFormats.find((value) => value === event.target.value) ??
                  "",
              })
            }
            className={styles.narrow}
          />
        </div>
        {availability && availability.timeZone !== shownZone ? (
          <p className={styles.note}>{Text.availabilityFollows}</p>
        ) : null}
        <SegmentedControl<ThemeChoice>
          label={Text.theme}
          options={ThemeChoices.map((value) => ({
            value,
            label: Text.themes[value],
          }))}
          value={theme.choice}
          onChange={theme.setChoice}
          className={styles.theme}
        />
        <span className={styles.note}>{Text.themeNote}</span>
      </section>

      <div className={styles.saveRow}>
        <Button
          variant="ghost"
          onClick={() => {
            setDraft(saved);
            setTried(false);
          }}
          disabled={!isDirty || save.isPending}
        >
          {Text.reset}
        </Button>
        <Button
          variant="primary"
          isLoading={save.isPending}
          disabled={!isDirty}
          onClick={() => {
            setTried(true);
            if (!nameProblem) save.mutate();
          }}
        >
          {Text.save}
        </Button>
      </div>

      <section
        id={accountNotificationsId}
        className={styles.block}
        aria-labelledby="account-notify"
      >
        <div className={styles.blockHead}>
          <h2 id="account-notify" className={styles.blockTitle}>
            {Text.notifications}
          </h2>
          <p className={styles.muted}>{Text.notificationsHelp}</p>
        </div>
        {notificationSettings ? (
          <NotificationSettingsForm settings={notificationSettings} />
        ) : null}
      </section>

      <section className={styles.card} aria-labelledby="account-help">
        <h2 id="account-help" className={styles.cardTitle}>
          {Text.help}
        </h2>
        <p className={styles.muted}>
          {Text.helpProgress(
            walkthrough.chapters.length - walkthrough.left.length,
            walkthrough.chapters.length,
          )}
        </p>
        <div className={styles.helpActions}>
          <Button iconStart="repeat" onClick={walkthrough.replay}>
            {Text.replay}
          </Button>
          <LinkButton to={RoutePaths.docs} variant="ghost" iconStart="help">
            {Text.openDocs}
          </LinkButton>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="account-password">
        <h2 id="account-password" className={styles.cardTitle}>
          {Text.password}
        </h2>
        <ChangePasswordForm
          email={member.email}
          onChanged={() =>
            toast.show({ tone: "success", title: Text.passwordChanged })
          }
        />
      </section>

      <section className={styles.card} aria-labelledby="account-devices">
        <h2 id="account-devices" className={styles.cardTitle}>
          {Text.devices}
        </h2>
        <p className={styles.muted}>{Text.devicesHelp}</p>
        {everywhere.error ? (
          <Banner tone="error">{Text.everywhereFailed}</Banner>
        ) : null}
        <div className={styles.helpActions}>
          <Button
            iconStart="logOut"
            onClick={() => everywhere.mutate()}
            isLoading={everywhere.isPending}
          >
            {Text.signOutEverywhere}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function AccountView() {
  const session = useSession();
  if (session.status !== "active") return null;
  return <Account key={session.member.id} member={session.member} />;
}
