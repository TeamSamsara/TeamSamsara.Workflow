// File : /TeamSamsara.Workflow/app/src/features/platforms/ui/PlatformsTable.tsx
// Version : 1.1.0
// Latest commit: task/group-leads-and-x-premium
// Author : Gerrah
// Purpose : The platform catalogue as a table: each platform with the limits
// Workflow checks, whether this workspace uses it, and a switch to change that
// (saved straight away). A platform with a paid tier (X Premium) has a box to
// say the workspace's account has it, which raises the limits shown.

import { useMutation } from "@tanstack/react-query";
import { dataErrorMessage } from "@/core/data";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Pill } from "@/shared/components/Pill/Pill";
import { Table } from "@/shared/components/Table/Table";
import { useToast } from "@/shared/components/Toast/useToast";
import type { Platform, PlatformSetting } from "../catalogue/platformTypes";
import {
  setPlatformEnabled,
  setPlatformPremium,
} from "../service/platformSettingsService";
import { describeLimits } from "./describeLimits";
import { PlatformMark } from "./PlatformMark";
import { PlatformsTableText } from "./platformsContent";
import styles from "./PlatformsTable.module.css";

/** The narrowest the table gets before it scrolls sideways. */
const tableMinWidth = 640;

interface PlatformsTableProps {
  settings: readonly PlatformSetting[];
  /** Whether the person may switch platforms (Manage settings). */
  canChange: boolean;
}

export function PlatformsTable({ settings, canChange }: PlatformsTableProps) {
  const toast = useToast();
  const toggle = useMutation({
    mutationFn: ({
      platform,
      enabled,
    }: {
      platform: Platform;
      enabled: boolean;
    }) => setPlatformEnabled(platform.id, enabled),
    onSuccess: (_result, { platform, enabled }) =>
      toast.show({
        tone: "success",
        title: enabled
          ? PlatformsTableText.turnedOn(platform.name)
          : PlatformsTableText.turnedOff(platform.name),
      }),
    onError: (error) =>
      toast.show({
        tone: "error",
        title: PlatformsTableText.failed,
        detail: dataErrorMessage(error),
      }),
  });

  const premium = useMutation({
    mutationFn: ({
      platform,
      hasPremium,
    }: {
      platform: Platform;
      hasPremium: boolean;
    }) => setPlatformPremium(platform.id, hasPremium),
    onSuccess: (_result, { platform, hasPremium }) => {
      const tier = platform.premium?.name ?? platform.name;
      toast.show({
        tone: "success",
        title: hasPremium
          ? PlatformsTableText.premiumOn(tier)
          : PlatformsTableText.premiumOff(tier),
      });
    },
    onError: (error) =>
      toast.show({
        tone: "error",
        title: PlatformsTableText.failed,
        detail: dataErrorMessage(error),
      }),
  });

  return (
    <Table caption={PlatformsTableText.caption} minWidth={tableMinWidth}>
      <thead>
        <tr>
          <th scope="col">{PlatformsTableText.platform}</th>
          <th scope="col">{PlatformsTableText.limits}</th>
          <th scope="col">{PlatformsTableText.status}</th>
          <th scope="col" className={styles.useHeading}>
            {PlatformsTableText.use}
          </th>
        </tr>
      </thead>
      <tbody>
        {settings.map(({ platform, enabled, hasPremium }) => {
          const isSaving =
            toggle.isPending && toggle.variables?.platform.id === platform.id;
          return (
            <tr key={platform.id}>
              <td>
                <span className={styles.platform}>
                  <PlatformMark platform={platform} />
                  <span className={styles.platformText}>
                    <b>{platform.name}</b>
                    {platform.premium ? (
                      <Checkbox
                        label={PlatformsTableText.premiumLabel(
                          platform.premium.name,
                        )}
                        checked={hasPremium}
                        onChange={(event) =>
                          premium.mutate({
                            platform,
                            hasPremium: event.target.checked,
                          })
                        }
                        disabled={!canChange || !enabled || premium.isPending}
                        className={styles.premium}
                      />
                    ) : null}
                  </span>
                </span>
              </td>
              <td className={styles.limits}>
                {describeLimits(platform, hasPremium)}
              </td>
              <td>
                <Pill tone={enabled ? "success" : "muted"}>
                  {enabled ? PlatformsTableText.on : PlatformsTableText.off}
                </Pill>
              </td>
              <td className={styles.useCell}>
                <button
                  type="button"
                  role="switch"
                  className={styles.switch}
                  aria-checked={enabled}
                  aria-label={PlatformsTableText.switchLabel(platform.name)}
                  disabled={!canChange || isSaving}
                  onClick={() => toggle.mutate({ platform, enabled: !enabled })}
                >
                  <span className={styles.knob} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
