// File : /TeamSamsara.Workflow/app/src/views/settings/general/GeneralSettingsForm.tsx
// Version : 1.0.0
// Latest commit: feature/workspace-settings
// Author : Gerrah
// Purpose : The fields of Settings → General, in three cards: the workspace's
// name; its time zone, week start, date and time formats; and the default
// theme. Used only by GeneralSettingsView, which holds the draft.

import { useMemo } from "react";
import { DateFormats, TimeFormats, WeekStarts } from "@/core/data";
import { ThemeChoices } from "@/core/theme";
import type { WorkspaceSettings } from "@/core/workspace";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { formatDate } from "@/shared/time/dates";
import { timeZoneOptions } from "@/shared/time/timeZones";
import { TextLimits } from "@/shared/validation/textLimits";
import { GeneralSettingsFormText as Text } from "./generalSettingsViewContent";
import styles from "./GeneralSettingsView.module.css";

/** The date every date format is shown with, so the choices can be compared. */
const exampleDate = new Date("2026-12-14T17:00:00Z");

interface GeneralSettingsFormProps {
  settings: WorkspaceSettings;
  onChange: (changes: Partial<WorkspaceSettings>) => void;
  nameError?: string;
  disabled: boolean;
}

/** The value picked in a Select, kept only if it's one of the choices. */
function pick<TValue extends string>(
  choices: readonly TValue[],
  value: string,
  fallback: TValue,
): TValue {
  return choices.find((choice) => choice === value) ?? fallback;
}

export function GeneralSettingsForm({
  settings,
  onChange,
  nameError,
  disabled,
}: GeneralSettingsFormProps) {
  const zones = useMemo(() => timeZoneOptions(), []);
  const dateOptions = DateFormats.map((value) => ({
    value,
    label: formatDate(exampleDate, settings.timeZone, value),
  }));

  return (
    <>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{Text.workspaceHeading}</h3>
        <TextField
          label={Text.name}
          value={settings.name}
          maxLength={TextLimits.name}
          onChange={(event) => onChange({ name: event.target.value })}
          hint={Text.nameHint}
          error={nameError}
          disabled={disabled}
          className={styles.nameField}
        />
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{Text.timeHeading}</h3>
        <div className={styles.row}>
          <Select
            label={Text.timeZone}
            options={zones}
            value={settings.timeZone}
            onChange={(event) => onChange({ timeZone: event.target.value })}
            disabled={disabled}
          />
          <Select
            label={Text.weekStartsOn}
            options={WeekStarts.map((value) => ({
              value,
              label: Text.weekStarts[value],
            }))}
            value={settings.weekStartsOn}
            onChange={(event) =>
              onChange({
                weekStartsOn: pick(
                  WeekStarts,
                  event.target.value,
                  WeekStarts[0],
                ),
              })
            }
            disabled={disabled}
          />
        </div>
        <div className={styles.row}>
          <Select
            label={Text.dateFormat}
            options={dateOptions}
            value={settings.dateFormat}
            onChange={(event) =>
              onChange({
                dateFormat: pick(
                  DateFormats,
                  event.target.value,
                  DateFormats[0],
                ),
              })
            }
            disabled={disabled}
          />
          <Select
            label={Text.timeFormat}
            options={TimeFormats.map((value) => ({
              value,
              label: Text.timeFormats[value],
            }))}
            value={settings.timeFormat}
            onChange={(event) =>
              onChange({
                timeFormat: pick(
                  TimeFormats,
                  event.target.value,
                  TimeFormats[0],
                ),
              })
            }
            disabled={disabled}
          />
        </div>
        <p className={styles.muted}>{Text.timeNote}</p>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{Text.lookHeading}</h3>
        <div className={styles.choice}>
          <span className={styles.choiceLabel} aria-hidden="true">
            {Text.defaultTheme}
          </span>
          <SegmentedControl
            label={Text.defaultTheme}
            options={ThemeChoices.map((value) => ({
              value,
              label: Text.themes[value],
            }))}
            value={settings.defaultTheme}
            onChange={(defaultTheme) => onChange({ defaultTheme })}
            disabled={disabled}
          />
          <p className={styles.muted}>{Text.themeHint}</p>
        </div>
      </section>
    </>
  );
}
