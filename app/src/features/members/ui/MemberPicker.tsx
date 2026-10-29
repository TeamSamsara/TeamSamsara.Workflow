// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberPicker.tsx
// Version : 1.0.0
// Latest commit: feature/members
// Author : Gerrah
// Purpose : A dialog to pick members (to give them a role, put them in a
// group, and later to hand over a task): search, tick, Add.

import { useState } from "react";
import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { Modal } from "@/shared/components/Modal/Modal";
import { filterMembers } from "../service/memberFilters";
import { memberName, type MemberListItem } from "../types/memberTypes";
import { MemberPickerText } from "./membersContent";
import styles from "./MemberPicker.module.css";

interface MemberPickerProps {
  title: string;
  /** The members that can be picked (already left out: those who have it). */
  items: readonly MemberListItem[];
  onPick: (memberIds: string[]) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export function MemberPicker({
  title,
  items,
  onPick,
  onClose,
  isSaving = false,
}: MemberPickerProps) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const shown = filterMembers(items, "all", search);

  function toggle(memberId: string, on: boolean) {
    setPicked((current) =>
      on ? [...current, memberId] : current.filter((id) => id !== memberId),
    );
  }

  return (
    <Modal
      title={title}
      onClose={isSaving ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            {MemberPickerText.cancel}
          </Button>
          <Button
            variant="primary"
            iconStart="add"
            onClick={() => onPick(picked)}
            disabled={picked.length === 0}
            isLoading={isSaving}
          >
            {MemberPickerText.add(picked.length)}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        {items.length ? (
          <TextField
            label={MemberPickerText.search}
            hideLabel
            type="search"
            leadingIcon="search"
            placeholder={MemberPickerText.search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
          />
        ) : null}
        {items.length === 0 ? (
          <p className={styles.muted}>{MemberPickerText.none}</p>
        ) : shown.length === 0 ? (
          <p className={styles.muted}>{MemberPickerText.noMatch}</p>
        ) : (
          <ul className={styles.list}>
            {shown.map((item) => {
              const name = memberName(item.member);
              return (
                <li key={item.member.id} className={styles.item}>
                  <Checkbox
                    checked={picked.includes(item.member.id)}
                    onChange={(event) =>
                      toggle(item.member.id, event.target.checked)
                    }
                    disabled={isSaving}
                    label={
                      <span className={styles.person}>
                        <Avatar name={name} size="small" />
                        <span className={styles.personText}>
                          <b>{name}</b>
                          {item.member.displayName.trim() ? (
                            <span className={styles.muted}>
                              {item.member.email}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
