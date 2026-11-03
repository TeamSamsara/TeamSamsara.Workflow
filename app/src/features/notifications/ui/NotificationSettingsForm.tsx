// File : /TeamSamsara.Workflow/app/src/features/notifications/ui/NotificationSettingsForm.tsx
// Version : 1.1.0
// Latest commit: fix/modal-and-account-notifications
// Author : Gerrah
// Purpose : What someone is told about, and where: a row per kind with a
// switch for In Playbook and for Email (Discord's says it's coming soon), then
// when to be reminded before tasks and events. Saves with one button; a test
// email checks email works.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { dataErrorMessage } from "@/core/data";
import { useSession } from "@/core/session";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Select } from "@/shared/components/Fields/Select/Select";
import { useToast } from "@/shared/components/Toast/useToast";
import {
  saveNotificationSettings,
  sendTestEmail,
} from "../service/notificationService";
import {
  EventReminders,
  SettingGroups,
  TaskReminders,
  type NotificationSettings,
  type SettingGroup,
} from "../types/notificationTypes";
import { NotificationSettingsText as Text } from "./notificationsContent";
import styles from "./NotificationSettingsForm.module.css";

interface NotificationSettingsFormProps {
  settings: NotificationSettings;
}

function Toggle({
  on,
  label,
  onChange,
}: {
  on: boolean;
  label: string;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={styles.switch}
      onClick={() => onChange(!on)}
    >
      <span className={styles.knob} />
    </button>
  );
}

export function NotificationSettingsForm({
  settings,
}: NotificationSettingsFormProps) {
  const session = useSession();
  const toast = useToast();
  const [draft, setDraft] = useState(settings);
  const memberId = session.status === "active" ? session.member.id : null;

  const save = useMutation({
    mutationFn: () => {
      if (!memberId) throw new Error("Not signed in");
      return saveNotificationSettings(memberId, draft);
    },
    onSuccess: () => toast.show({ tone: "success", title: Text.saved }),
  });
  const test = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (email) =>
      toast.show({ tone: "success", title: Text.testSent(email) }),
  });

  const flip = (channel: "app" | "email", group: SettingGroup, on: boolean) =>
    setDraft((current) => ({
      ...current,
      [channel]: { ...current[channel], [group]: on },
    }));

  return (
    <div className={styles.form}>
      {save.error ? (
        <Banner tone="error">
          {Text.failed}: {dataErrorMessage(save.error)}
        </Banner>
      ) : null}
      {test.error ? (
        <Banner tone="error">
          {Text.testFailed}: {test.error.message}
        </Banner>
      ) : null}

      <section className={styles.card}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{Text.tellMe}</th>
                <th scope="col">{Text.inApp}</th>
                <th scope="col">{Text.email}</th>
                <th scope="col">{Text.discord}</th>
              </tr>
            </thead>
            <tbody>
              {SettingGroups.map((group) => (
                <tr key={group}>
                  <th scope="row">
                    <span className={styles.kind}>
                      <b>{Text.groups[group].name}</b>
                      <span className={styles.muted}>
                        {Text.groups[group].help}
                      </span>
                    </span>
                  </th>
                  <td>
                    <Toggle
                      on={draft.app[group]}
                      label={Text.switchLabel(
                        Text.groups[group].name,
                        Text.inApp,
                      )}
                      onChange={(on) => flip("app", group, on)}
                    />
                  </td>
                  <td>
                    <Toggle
                      on={draft.email[group]}
                      label={Text.switchLabel(
                        Text.groups[group].name,
                        Text.email,
                      )}
                      onChange={(on) => flip("email", group, on)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.soon}
                      aria-label={Text.discordSoon(Text.groups[group].name)}
                      onClick={() =>
                        toast.show({
                          tone: "info",
                          title: Text.comingSoon,
                          detail: Text.comingSoonBody,
                        })
                      }
                    >
                      <span className={styles.soonKnob} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.card} data-padded>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>{Text.reminders}</h2>
          <p className={styles.muted}>{Text.remindersHelp}</p>
        </div>
        <div className={styles.row}>
          <Select
            label={Text.taskReminder}
            options={TaskReminders.map((value) => ({
              value,
              label: Text.taskReminders[value],
            }))}
            value={draft.taskReminder}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                taskReminder:
                  TaskReminders.find((value) => value === event.target.value) ??
                  current.taskReminder,
              }))
            }
          />
          <Select
            label={Text.eventReminder}
            options={EventReminders.map((value) => ({
              value,
              label: Text.eventReminders[value],
            }))}
            value={draft.eventReminder}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                eventReminder:
                  EventReminders.find(
                    (value) => value === event.target.value,
                  ) ?? current.eventReminder,
              }))
            }
          />
        </div>
      </section>

      <div className={styles.actions}>
        <Button
          variant="ghost"
          iconStart="email"
          onClick={() => test.mutate()}
          isLoading={test.isPending}
        >
          {Text.testEmail}
        </Button>
        <Button
          variant="primary"
          onClick={() => save.mutate()}
          isLoading={save.isPending}
        >
          {Text.save}
        </Button>
      </div>
    </div>
  );
}
