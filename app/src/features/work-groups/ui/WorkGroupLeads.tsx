// File : /TeamSamsara.Workflow/app/src/features/work-groups/ui/WorkGroupLeads.tsx
// Version : 1.0.0
// Latest commit: fix/group-leads-and-x-premium
// Author : Gerrah
// Purpose : A group's leads: each with avatar, name and a remove button, and
// Add lead. Picking people is the page's job (it has the member list), so this
// only shows them and reports clicks. A lead who can no longer approve or
// reassign tasks is flagged so they can be replaced.

import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { maxGroupLeads } from "../types/workGroupTypes";
import { WorkGroupLeadsText as Text } from "./workGroupsContent";
import styles from "./WorkGroupEditorParts.module.css";

export interface LeadEntry {
  id: string;
  name: string;
  email: string;
  /** Still holds Approve tasks or Reassign tasks. */
  eligible: boolean;
}

interface WorkGroupLeadsProps {
  leads: readonly LeadEntry[];
  onAdd: () => void;
  onRemove: (memberId: string) => void;
  disabled?: boolean;
}

export function WorkGroupLeads({
  leads,
  onAdd,
  onRemove,
  disabled = false,
}: WorkGroupLeadsProps) {
  const isFull = leads.length >= maxGroupLeads;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.heading}>{Text.heading}</h3>
        <Button
          size="small"
          iconStart="add"
          onClick={onAdd}
          disabled={disabled || isFull}
        >
          {Text.add}
        </Button>
      </div>
      {leads.length === 0 ? (
        <p className={styles.muted}>{Text.none}</p>
      ) : (
        <ul className={styles.leads}>
          {leads.map((lead) => (
            <li
              key={lead.id}
              className={styles.lead}
              data-eligible={lead.eligible}
            >
              <Avatar name={lead.name} size="small" />
              <span className={styles.leadText}>
                <b>{lead.name}</b>
                <span className={styles.muted}>
                  {lead.eligible ? lead.email : Text.notEligible}
                </span>
              </span>
              <IconButton
                icon="close"
                label={Text.remove(lead.name)}
                variant="ghost"
                size="small"
                onClick={() => onRemove(lead.id)}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      )}
      <p className={styles.muted}>
        {isFull ? Text.max(maxGroupLeads) : Text.note}
      </p>
    </div>
  );
}
