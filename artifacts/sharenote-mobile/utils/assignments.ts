import type { AppEvent, AppTask, FamilyMember } from '@/context/AppState';

type AssignableItem = Pick<AppEvent | AppTask, 'personId' | 'personIds'>;

export function getAssignedPersonIds(item: AssignableItem) {
  if (item.personIds?.length) return item.personIds;
  return item.personId ? [item.personId] : [];
}

export function isAssignedToPerson(item: AssignableItem, personId: string) {
  return getAssignedPersonIds(item).includes(personId);
}

export function getAssignedMembers(item: AssignableItem, members: FamilyMember[]) {
  const assignedIds = getAssignedPersonIds(item);
  return assignedIds
    .map((id) => members.find((member) => member.id === id))
    .filter((member): member is FamilyMember => Boolean(member));
}

export function getPrimaryAssignment(item: AssignableItem, members: FamilyMember[]) {
  return getAssignedMembers(item, members)[0] ?? null;
}
