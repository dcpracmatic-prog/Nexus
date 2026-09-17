/**
 * Soft-optional Firebase. If config/init fails, all helpers no-op / localStorage-only
 * so `npm run dev` demos work without Google.
 */
import type { NexusSessionUser } from "./session";
import { GUEST_USER, toSessionUser } from "./session";

type Unsubscribe = () => void;

let firebaseReady = false;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;
let initError: string | null = null;

async function tryInit(): Promise<boolean> {
  if (firebaseReady) return true;
  if (initError) return false;
  try {
    const [{ initializeApp, getApps, getApp }, authMod, fsMod, configMod] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
      import("@/firebase-applet-config.json")
    ]);
    const firebaseConfig = (configMod as any).default || configMod;
    if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId) {
      initError = "Firebase config incompleta";
      return false;
    }
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = authMod.getAuth(app);
    googleProvider = new authMod.GoogleAuthProvider();
    db = firebaseConfig.firestoreDatabaseId
      ? fsMod.getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : fsMod.getFirestore(app);
    firebaseReady = true;
    return true;
  } catch (e: any) {
    initError = e?.message || "Firebase init failed";
    console.warn("Firebase unavailable — modo invitado local:", initError);
    return false;
  }
}

/** Eager soft init (non-blocking for callers that don't await). */
void tryInit();

export function isFirebaseAvailable(): boolean {
  return firebaseReady;
}

export function getFirebaseInitError(): string | null {
  return initError;
}

export async function signInWithGoogle(): Promise<NexusSessionUser | null> {
  const ok = await tryInit();
  if (!ok || !auth || !googleProvider) {
    throw new Error("Firebase no disponible. Continúa en modo invitado local.");
  }
  const { signInWithPopup } = await import("firebase/auth");
  const result = await signInWithPopup(auth, googleProvider);
  return toSessionUser(result.user);
}

export async function logOut(): Promise<void> {
  if (!auth) return;
  try {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  } catch (e) {
    console.warn("Sign out failed:", e);
  }
}

/**
 * Subscribe to auth. Always invokes callback at least once with guest or remote user.
 * If Firebase is unavailable, stays on guest.
 */
export function subscribeToAuth(callback: (user: NexusSessionUser) => void): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let cancelled = false;

  (async () => {
    const ok = await tryInit();
    if (cancelled) return;
    if (!ok || !auth) {
      callback({ ...GUEST_USER });
      return;
    }
    const { onAuthStateChanged } = await import("firebase/auth");
    unsub = onAuthStateChanged(auth, (u) => {
      if (u) callback(toSessionUser(u));
      else callback({ ...GUEST_USER });
    });
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function saveDocument(
  collectionName: string,
  docId: string,
  data: any,
  userId?: string
) {
  // Always mirror to localStorage
  try {
    const localKey = `nexus_${collectionName}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
    const filtered = existing.filter((item: any) => item.id !== docId);
    filtered.unshift({ ...data, id: docId });
    localStorage.setItem(localKey, JSON.stringify(filtered.slice(0, 100)));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  const ok = await tryInit();
  if (!ok || !db) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    if (auth?.currentUser || userId) {
      const targetUserId = userId || auth?.currentUser?.uid;
      if (targetUserId && !String(targetUserId).startsWith("local-")) {
        const ref = doc(db, collectionName, docId);
        await setDoc(
          ref,
          { ...data, userId: targetUserId, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    }
  } catch (err) {
    console.warn(`Firestore save skipped for ${collectionName}/${docId}:`, err);
  }
}

export async function fetchCollection(collectionName: string, userId?: string): Promise<any[]> {
  const ok = await tryInit();
  if (ok && db && userId && !String(userId).startsWith("local-")) {
    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const q = query(collection(db, collectionName), where("userId", "==", userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      }
    } catch (err) {
      console.warn(`Firestore fetch failed for ${collectionName}:`, err);
    }
  }
  try {
    const localKey = `nexus_${collectionName}`;
    return JSON.parse(localStorage.getItem(localKey) || "[]");
  } catch {
    return [];
  }
}

export async function deleteDocument(collectionName: string, docId: string) {
  try {
    const localKey = `nexus_${collectionName}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
    localStorage.setItem(
      localKey,
      JSON.stringify(existing.filter((item: any) => item.id !== docId))
    );
  } catch (e) {
    console.error("Local storage error:", e);
  }

  const ok = await tryInit();
  if (!ok || !db || !auth?.currentUser) return;
  try {
    const { deleteDoc, doc } = await import("firebase/firestore");
    await deleteDoc(doc(db, collectionName, docId));
  } catch (err) {
    console.warn(`Firestore delete skipped for ${collectionName}/${docId}:`, err);
  }
}
