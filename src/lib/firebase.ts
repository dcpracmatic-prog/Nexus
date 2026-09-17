import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  Firestore
} from "firebase/firestore";
import firebaseConfig from "@/firebase-applet-config.json";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom database ID if specified
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Authentication helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore data helpers with graceful local fallback
export async function saveDocument(collectionName: string, docId: string, data: any, userId?: string) {
  try {
    if (auth.currentUser || userId) {
      const targetUserId = userId || auth.currentUser?.uid;
      const ref = doc(db, collectionName, docId);
      await setDoc(ref, { ...data, userId: targetUserId, updatedAt: new Date().toISOString() }, { merge: true });
    }
  } catch (err) {
    console.warn(`Firestore save failed for ${collectionName}/${docId}, saving to localStorage:`, err);
  }
  // Also sync to localStorage for offline access
  try {
    const localKey = `nexus_${collectionName}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
    const filtered = existing.filter((item: any) => item.id !== docId);
    filtered.unshift(data);
    localStorage.setItem(localKey, JSON.stringify(filtered.slice(0, 100)));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

export async function fetchCollection(collectionName: string, userId?: string): Promise<any[]> {
  try {
    const targetUserId = userId || auth.currentUser?.uid;
    if (targetUserId) {
      const q = query(collection(db, collectionName), where("userId", "==", targetUserId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ ...d.data(), id: d.id }));
      }
    }
  } catch (err) {
    console.warn(`Firestore fetch failed for ${collectionName}, falling back to localStorage:`, err);
  }
  // Local fallback
  try {
    const localKey = `nexus_${collectionName}`;
    return JSON.parse(localStorage.getItem(localKey) || "[]");
  } catch {
    return [];
  }
}

export async function deleteDocument(collectionName: string, docId: string) {
  try {
    if (auth.currentUser) {
      await deleteDoc(doc(db, collectionName, docId));
    }
  } catch (err) {
    console.warn(`Firestore delete failed for ${collectionName}/${docId}:`, err);
  }
  try {
    const localKey = `nexus_${collectionName}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
    const updated = existing.filter((item: any) => item.id !== docId);
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}
