// File : /TeamSamsara.Workflow/app/src/features/members/ui/InviteDialog.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : Invite people: their emails, the roles they start with (only roles
// you may give), and their work groups. Sends one by one, then lists how each
// email went.

import { useState } from "react";
import { usePermissions } from "@/core/access";
import { givableRoles, RolePicker } from "@/features/roles";
import { useWorkGroups, WorkGroupPicker } from "@/features/work-groups";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { Icon } from "@/shared/icons/Icon";
import { useInviteMembers } from "../hooks/useInviteMembers";
import type { InviteOutcome } from "../types/memberTypes";
import { EmailListInput } from "./EmailListInput";
import { InviteDialogText } from "./membersContent";
import styles from "./InviteDialog.module.css";

interface InviteDialogProps {
  onClose: () => void;
}

const goodOutcomes: readonly InviteOutcome[] = ["invited", "reinvited"];

export function InviteDialog({ onClose }: InviteDialogProps) {
  const access = usePermissions();
  const groups = useWorkGroups();
  const { invite, isSending, isDone, results, isReady } = useInviteMembers();
  const [emails, setEmails] = useState<string[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [workGroupIds, setWorkGroupIds] = useState<string[]>([]);
  const [tried, setTried] = useState(false);

  const roles = access.roles
    ? givableRoles(access.roles, {
        memberRoleIds: access.memberRoleIds,
        permissions: access.permissions,
      })
    : [];

  function send() {
    setTried(true);
    if (emails.length === 0) return;
    invite({ emails, choice: { roleIds, workGroupIds } });
  }

  const showResults = isSending || isDone;

  return (
    <Modal
      title={InviteDialogText.title}
      description={InviteDialogText.description}
      size="wide"
      onClose={isSending ? undefined : onClose}
      footer={
        isDone ? (
          <Button variant="primary" onClick={onClose}>
            {InviteDialogText.close}
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={isSending}>
              {InviteDialogText.cancel}
            </Button>
            <Button
              variant="primary"
              iconStart="send"
              onClick={send}
              isLoading={isSending}
              disabled={!isReady}
            >
              {InviteDialogText.send(emails.length)}
            </Button>
          </>
        )
      }
    >
      {showResults ? (
        <div className={styles.body}>
          <h3 className={styles.resultsTitle}>
            {isSending
              ? InviteDialogText.sending(results.length, emails.length)
              : InviteDialogText.resultsTitle}
          </h3>
          <ul className={styles.results}>
            {results.map((result) => {
              const ok = goodOutcomes.includes(result.outcome);
              return (
                <li key={result.email} className={styles.result} data-ok={ok}>
                  <Icon name={ok ? "check" : "warning"} />
                  <span className={styles.resultText}>
                    <b>{result.email}</b>
                    <span>{InviteDialogText.outcome[result.outcome]}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className={styles.body}>
          <EmailListInput
            emails={emails}
            onChange={setEmails}
            error={
              tried && emails.length === 0 ? InviteDialogText.needEmail : null
            }
            autoFocus
          />
          <RolePicker
            roles={roles}
            selectedIds={roleIds}
            onChange={setRoleIds}
          />
          <WorkGroupPicker
            groups={groups.items.map((item) => item.group)}
            selectedIds={workGroupIds}
            onChange={setWorkGroupIds}
            hideHint
          />
          <Banner tone="info" icon="time">
            {InviteDialogText.linkNote}
          </Banner>
        </div>
      )}
    </Modal>
  );
}
