/**
 * Local-first session. Demo works without Firebase / Google.
 * Firebase (if configured and reachable) is an optional sync overlay.
 */

export interface NexusSessionUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  isGuest: boolean;
}

export const GUEST_USER: NexusSessionUser = {
  uid: "local-guest",
  displayName: "Invitado local",
  email: null,
  photoURL: null,
  isGuest: true
};

const STORAGE_KEY = "nexus_session_user";

export function loadSessionUser(): NexusSessionUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...GUEST_USER };
    const parsed = JSON.parse(raw) as NexusSessionUser;
    if (parsed?.uid) return parsed;
  } catch {
    /* ignore */
  }
  return { ...GUEST_USER };
}

export function persistSessionUser(user: NexusSessionUser): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

export function clearSessionUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function toSessionUser(remote: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}): NexusSessionUser {
  return {
    uid: remote.uid,
    displayName: remote.displayName || remote.email?.split("@")[0] || "Usuario",
    email: remote.email ?? null,
    photoURL: remote.photoURL ?? null,
    isGuest: false
  };
}
