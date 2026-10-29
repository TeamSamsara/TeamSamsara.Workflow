// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberAccessCard.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A member's access: resend the invite (while they haven't signed
// in), turn access off or back on, and remove them from the workspace. Turning
// off and removing ask first. Your own access can't be changed here.

import { useState } from "react";
import type { MemberRecord } from "@/core/data";
import { Button } from "@/shared/components/Button/Button";
import { Modal } from "@/shared/components/Modal/Modal";
import { useMemberActions } from "../hooks/useMemberActions";
import { memberName } from "../types/memberTypes";
import { MemberAccessText } from "./membersContent";
import styles from "./MemberCards.module.css";

interface MemberAccessCardProps {
  member: MemberRecord;
  /** It's the signed-in member's own record. */
  isSelf: boolean;
  /** The editor may not change this member (e.g. an Administrator, for a non-admin). */
  locked: boolean;
  onRemoved: () => void;
}

type Confirming = "off" | "remove" | null;

export function MemberAccessCard({
  member,
  isSelf,
  locked,
  onRemoved,
}: MemberAccessCardProps) {
  const actions = useMemberActions(member);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const name = memberName(member);
  const disabled = isSelf || locked || actions.isBusy;
  const isOff = member.status === "disabled";

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{MemberAccessText.title}</h2>
      {isSelf ? <p className={styles.muted}>{MemberAccessText.self}</p> : null}

      {member.status === "invited" ? (
        <div className={styles.accessRow}>
          <span className={styles.accessText}>
            <b>{MemberAccessText.resendTitle}</b>
            <span className={styles.muted}>{MemberAccessText.resendBody}</span>
          </span>
          <Button
            iconStart="send"
            onClick={() => actions.resend.mutate()}
            isLoading={actions.resend.isPending}
            disabled={disabled}
          >
            {MemberAccessText.resend}
          </Button>
        </div>
      ) : null}

      <div className={styles.accessRow}>
        <span className={styles.accessText}>
          <b>{isOff ? MemberAccessText.onTitle : MemberAccessText.offTitle}</b>
          <span className={styles.muted}>
            {isOff
              ? MemberAccessText.onBody(name)
              : MemberAccessText.offBody(name)}
          </span>
        </span>
        {isOff ? (
          <Button
            onClick={() => actions.turnOn.mutate()}
            isLoading={actions.turnOn.isPending}
            disabled={disabled}
          >
            {MemberAccessText.on}
          </Button>
        ) : (
          <Button onClick={() => setConfirming("off")} disabled={disabled}>
            {MemberAccessText.off}
          </Button>
        )}
      </div>

      <div className={styles.accessRow}>
        <span className={styles.accessText}>
          <b>{MemberAccessText.removeTitle}</b>
          <span className={styles.muted}>{MemberAccessText.removeBody}</span>
        </span>
        <Button
          variant="danger"
          iconStart="trash"
          onClick={() => setConfirming("remove")}
          disabled={disabled}
        >
          {MemberAccessText.remove}
        </Button>
      </div>

      {confirming ? (
        <Modal
          title={
            confirming === "off"
              ? MemberAccessText.confirmOff(name)
              : MemberAccessText.confirmRemove(name)
          }
          onClose={actions.isBusy ? undefined : () => setConfirming(null)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirming(null)}
                disabled={actions.isBusy}
              >
                {MemberAccessText.cancel}
              </Button>
              <Button
                variant="danger"
                isLoading={actions.isBusy}
                onClick={() => {
                  if (confirming === "off") {
                    actions.turnOff.mutate(undefined, {
                      onSuccess: () => setConfirming(null),
                    });
                  } else {
                    actions.remove.mutate(undefined, { onSuccess: onRemoved });
                  }
                }}
              >
                {confirming === "off"
                  ? MemberAccessText.off
                  : MemberAccessText.remove}
              </Button>
            </>
          }
        >
          <p className={styles.text}>
            {confirming === "off"
              ? MemberAccessText.confirmOffBody
              : MemberAccessText.confirmRemoveBody}
          </p>
        </Modal>
      ) : null}
    </section>
  );
}
