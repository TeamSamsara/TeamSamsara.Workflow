// File : /TeamSamsara.Workflow/app/src/features/members/ui/MemberTagsCard.tsx
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : A member's people tags on their settings page. A click puts a
// tag on or off and saves at once (it isn't part of Save changes).

import { usePermissions } from "@/core/access";
import type { MemberRecord } from "@/core/data";
import { TagEditor, usePeopleTags } from "@/features/people-tags";
import { MemberCardsText } from "./membersContent";
import styles from "./MemberCards.module.css";

export function MemberTagsCard({
  member,
  name,
}: {
  member: MemberRecord;
  name: string;
}) {
  const access = usePermissions();
  const tags = usePeopleTags();
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{MemberCardsText.tagsTitle}</h2>
      <TagEditor
        memberId={member.id}
        name={name}
        tagIds={member.tagIds}
        tags={tags.items}
        canEdit={access.can("tagPeople") || access.can("manageMembers")}
      />
      <p className={styles.muted}>{MemberCardsText.tagsNote}</p>
    </section>
  );
}
