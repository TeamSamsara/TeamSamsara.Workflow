// File : /TeamSamsara.Workflow/app/src/features/people-tags/ui/PeopleTagsCard.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The People tags card in Settings › Members: the workspace's tags
// in their order (drag to reorder) with how many people have each; add one,
// rename it, recolour it or delete it (it comes off everyone who had it).
// The list starts empty; each team makes its own.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { usePermissions } from "@/core/access";
import { Collections, type ColouredItem, type MemberRecord } from "@/core/data";
import {
  ColouredItemDialog,
  saveSetupOrder,
  SetupListCard,
  TagChip,
  usePeopleTags,
} from "@/features/task-setup";
import { deletePeopleTag } from "../service/peopleTagService";
import { PeopleTagsText as Text } from "./peopleTagsContent";
import styles from "./PeopleTags.module.css";

interface PeopleTagsCardProps {
  members: readonly MemberRecord[];
}

export function PeopleTagsCard({ members }: PeopleTagsCardProps) {
  const access = usePermissions();
  const canEdit = access.can("tagPeople") || access.can("manageMembers");
  const tags = usePeopleTags();
  const [dialog, setDialog] = useState<{ item: ColouredItem | null } | null>(
    null,
  );
  const reorder = useMutation({
    mutationFn: (ids: string[]) => saveSetupOrder(Collections.peopleTags, ids),
  });
  const count = (tagId: string) =>
    members.filter(
      (member) => member.status !== "removed" && member.tagIds.includes(tagId),
    ).length;

  return (
    <>
      <SetupListCard
        title={Text.title}
        description={Text.description}
        addLabel={Text.add}
        items={tags.items}
        readOnly={!canEdit}
        renderLabel={(item) => <TagChip item={item} />}
        renderDetail={(item) => Text.count(count(item.id))}
        onAdd={() => setDialog({ item: null })}
        onEdit={(item) => setDialog({ item })}
        onReorder={(ids) => reorder.mutate(ids)}
        isSavingOrder={reorder.isPending}
        empty={<p className={styles.none}>{Text.empty}</p>}
      />
      {dialog ? (
        <ColouredItemDialog
          list="peopleTag"
          item={dialog.item}
          items={tags.items}
          onClose={() => setDialog(null)}
          onDelete={(item) => deletePeopleTag(item.id, members)}
        />
      ) : null}
    </>
  );
}
