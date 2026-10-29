// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/WorkGroupLinks.tsx
// Version : 1.0.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A group's named links (a shared drive, brand assets…): a name and
// a web address per row, Add link, remove, and an open button once the
// address is valid. Saved with the rest of the group.

import { IconButton } from "@/shared/components/Button/IconButton";
import { Button } from "@/shared/components/Button/Button";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Icon } from "@/shared/icons/Icon";
import { TextLimits } from "@/shared/validation/textLimits";
import { checkLink } from "../service/groupLeads";
import { maxGroupLinks, type WorkGroupLink } from "../types/workGroupTypes";
import { WorkGroupLinksText as Text } from "./workGroupsContent";
import styles from "./WorkGroupEditorParts.module.css";

interface WorkGroupLinksProps {
  links: readonly WorkGroupLink[];
  onChange: (links: WorkGroupLink[]) => void;
  disabled?: boolean;
}

export function WorkGroupLinks({
  links,
  onChange,
  disabled = false,
}: WorkGroupLinksProps) {
  const isFull = links.length >= maxGroupLinks;

  function update(index: number, changes: Partial<WorkGroupLink>) {
    onChange(
      links.map((link, at) => (at === index ? { ...link, ...changes } : link)),
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.heading}>{Text.heading}</h3>
        <Button
          size="small"
          iconStart="add"
          onClick={() => onChange([...links, { label: "", url: "" }])}
          disabled={disabled || isFull}
        >
          {Text.add}
        </Button>
      </div>
      {links.length === 0 ? <p className={styles.muted}>{Text.none}</p> : null}
      {links.map((link, index) => {
        // Only complain once something has been typed in the row.
        const touched = Boolean(link.label || link.url);
        const errors = touched ? checkLink(link) : {};
        const canOpen = touched && !errors.url;
        return (
          <div key={index} className={styles.linkRow}>
            <TextField
              label={Text.label}
              hideLabel={index > 0}
              placeholder={Text.labelPlaceholder}
              value={link.label}
              maxLength={TextLimits.name}
              onChange={(event) => update(index, { label: event.target.value })}
              error={errors.label}
              disabled={disabled}
              className={styles.linkLabel}
            />
            <TextField
              label={Text.url}
              hideLabel={index > 0}
              type="url"
              inputMode="url"
              placeholder={Text.urlPlaceholder}
              value={link.url}
              onChange={(event) => update(index, { url: event.target.value })}
              error={errors.url}
              disabled={disabled}
              className={styles.linkUrl}
            />
            <span className={styles.linkActions} data-first={index === 0}>
              {canOpen ? (
                <a
                  href={link.url.trim()}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={styles.openLink}
                  aria-label={Text.open(link.label)}
                >
                  <Icon name="externalLink" />
                </a>
              ) : (
                <span className={styles.openSpacer} aria-hidden="true" />
              )}
              <IconButton
                icon="trash"
                label={Text.remove(link.label)}
                variant="ghost"
                size="small"
                onClick={() => onChange(links.filter((_, at) => at !== index))}
                disabled={disabled}
              />
            </span>
          </div>
        );
      })}
      <p className={styles.muted}>
        {isFull ? Text.max(maxGroupLinks) : Text.note}
      </p>
    </div>
  );
}
