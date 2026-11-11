// File : /TeamSamsara.Workflow/app/src/features/availability/model/teamSections.ts
// Version : 1.0.0
// Latest commit: feature/audit-fixes
// Author : Gerrah
// Purpose : The people list on Team availability: grouped by people tag (each
// person under their first tag, in the tags' order; untagged people last),
// each group in the viewer's own order (then by name), and a new order when
// they drag someone within a group.

export interface ListPerson {
  id: string;
  name: string;
  tagIds: readonly string[];
}

export interface TeamSection<TPerson extends ListPerson> {
  /** The tag's id, or "untagged". */
  key: string;
  tagId: string | null;
  people: TPerson[];
}

const untagged = "untagged";

/** People in the saved order first, the rest by name. */
export function inOrder<TPerson extends ListPerson>(
  people: readonly TPerson[],
  order: readonly string[],
): TPerson[] {
  const at = (id: string) => {
    const index = order.indexOf(id);
    return index < 0 ? Infinity : index;
  };
  return [...people].sort(
    (a, b) => at(a.id) - at(b.id) || a.name.localeCompare(b.name),
  );
}

/** The groups, in the tags' order; with no tags, one group of everyone. */
export function sectionsOf<TPerson extends ListPerson>(
  people: readonly TPerson[],
  tagIds: readonly string[],
  order: readonly string[],
): TeamSection<TPerson>[] {
  const ordered = inOrder(people, order);
  const firstTag = (person: TPerson) =>
    tagIds.find((id) => person.tagIds.includes(id)) ?? null;
  const sections = tagIds.map((tagId): TeamSection<TPerson> => ({
    key: tagId,
    tagId,
    people: ordered.filter((person) => firstTag(person) === tagId),
  }));
  const rest = ordered.filter((person) => firstTag(person) === null);
  return [
    ...sections.filter((section) => section.people.length > 0),
    ...(rest.length > 0 ? [{ key: untagged, tagId: null, people: rest }] : []),
  ];
}

/** The whole order once one group's people are put in a new order. */
export function reorderSection<TPerson extends ListPerson>(
  sections: readonly TeamSection<TPerson>[],
  key: string,
  ids: readonly string[],
): string[] {
  return sections.flatMap((section) =>
    section.key === key ? [...ids] : section.people.map((person) => person.id),
  );
}
