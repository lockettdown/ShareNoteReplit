const FAMILY_EMAIL_KEY = 'sharenote.family-email';

type LocalStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const memoryStore = new Map<string, string>();

function getStorage(): LocalStore {
  const maybeStorage = (globalThis as unknown as { localStorage?: LocalStore }).localStorage;
  if (maybeStorage) return maybeStorage;

  return {
    getItem: (key) => memoryStore.get(key) ?? null,
    setItem: (key, value) => {
      memoryStore.set(key, value);
    },
    removeItem: (key) => {
      memoryStore.delete(key);
    },
  };
}

function profileKey(familyEmail: string) {
  return `sharenote.active-profile-id:${familyEmail.trim().toLowerCase() || 'default'}`;
}

export function normalizeFamilyEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getStoredFamilyEmail() {
  return getStorage().getItem(FAMILY_EMAIL_KEY) ?? '';
}

export function storeFamilyEmail(email: string) {
  getStorage().setItem(FAMILY_EMAIL_KEY, normalizeFamilyEmail(email));
}

export function clearStoredFamilyEmail() {
  getStorage().removeItem(FAMILY_EMAIL_KEY);
}

export function getStoredActiveProfileId(familyEmail: string) {
  return getStorage().getItem(profileKey(familyEmail));
}

export function storeActiveProfileId(familyEmail: string, profileId: string) {
  getStorage().setItem(profileKey(familyEmail), profileId);
}

export function clearStoredActiveProfileId(familyEmail: string) {
  getStorage().removeItem(profileKey(familyEmail));
}
