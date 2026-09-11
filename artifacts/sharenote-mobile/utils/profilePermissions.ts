import type { FamilyMember } from '@/context/AppState';

export type ProfilePermissionRole = 'Parent' | 'Child';

export function isParentRole(role?: string) {
  return role?.trim().toLowerCase() === 'parent';
}

export function normalizeProfileRole(role?: string): ProfilePermissionRole {
  return isParentRole(role) ? 'Parent' : 'Child';
}

export function profileCanManage(profile: FamilyMember | null | undefined, isServerAuthorized: boolean) {
  return Boolean(isServerAuthorized && isParentRole(profile?.role));
}
