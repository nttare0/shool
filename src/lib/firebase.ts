"use client";

import type { AppState } from "./types";

/**
 * Firebase web config.
 *
 * These values are public by design (they identify the project, they don't grant
 * access). Override them with NEXT_PUBLIC_FIREBASE_* env vars to point the app
 * at your own project — see README.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCN79mExeAMLpL6XTgGzyN9LUAgTEdZOUg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "student-os-e0962.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "student-os-e0962",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "student-os-e0962.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "809625311961",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:809625311961:web:9a05bf1ee0d1a3db0f6b48",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

type FirebaseBundle = {
  auth: import("firebase/auth").Auth;
  db: import("firebase/firestore").Firestore;
  mods: {
    auth: typeof import("firebase/auth");
    firestore: typeof import("firebase/firestore");
  };
};

let bundle: Promise<FirebaseBundle> | null = null;

/** Lazily initialise Firebase in the browser only. */
export function getFirebase(): Promise<FirebaseBundle> {
  if (!bundle) {
    bundle = (async () => {
      const [{ initializeApp, getApps }, authMod, fsMod] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      return {
        auth: authMod.getAuth(app),
        db: fsMod.getFirestore(app),
        mods: { auth: authMod, firestore: fsMod },
      };
    })();
  }
  return bundle;
}

const DOC = (uidValue: string) => ["students", uidValue, "state", "v2"] as const;

export async function loadRemoteState(uidValue: string): Promise<AppState | null> {
  const { db, mods } = await getFirebase();
  const ref = mods.firestore.doc(db, ...DOC(uidValue));
  const snap = await mods.firestore.getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as { state?: AppState };
  return data?.state ?? null;
}

export async function saveRemoteState(uidValue: string, state: AppState): Promise<void> {
  const { db, mods } = await getFirebase();
  const ref = mods.firestore.doc(db, ...DOC(uidValue));
  await mods.firestore.setDoc(
    ref,
    { state: { ...state, updatedAt: new Date().toISOString() }, syncedAt: Date.now() },
    { merge: true },
  );
}

export type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
};

function toUser(user: import("firebase/auth").User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
  };
}

export async function watchAuth(cb: (user: AuthUser | null) => void): Promise<() => void> {
  const { auth, mods } = await getFirebase();
  return mods.auth.onAuthStateChanged(auth, (user) => cb(toUser(user)));
}

export async function signInWithGoogle(): Promise<AuthUser | null> {
  const { auth, mods } = await getFirebase();
  const provider = new mods.auth.GoogleAuthProvider();
  const cred = await mods.auth.signInWithPopup(auth, provider);
  return toUser(cred.user);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser | null> {
  const { auth, mods } = await getFirebase();
  const cred = await mods.auth.signInWithEmailAndPassword(auth, email, password);
  return toUser(cred.user);
}

export async function registerWithEmail(
  email: string,
  password: string,
  name?: string,
): Promise<AuthUser | null> {
  const { auth, mods } = await getFirebase();
  const cred = await mods.auth.createUserWithEmailAndPassword(auth, email, password);
  if (name && cred.user) {
    await mods.auth.updateProfile(cred.user, { displayName: name });
  }
  return toUser(cred.user);
}

export async function signOutNow(): Promise<void> {
  const { auth, mods } = await getFirebase();
  await mods.auth.signOut(auth);
}

/** Human-friendly messages for the errors people actually hit. */
export function describeAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain isn't authorised for Google sign-in yet. Add it in Firebase → Authentication → Settings → Authorised domains, or use email instead.";
    case "auth/operation-not-allowed":
      return "That sign-in method is disabled in this Firebase project. Enable it in Firebase → Authentication → Sign-in method.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups for this site and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password combination doesn't match an account.";
    case "auth/email-already-in-use":
      return "An account with that email already exists — try signing in instead.";
    case "auth/weak-password":
      return "Passwords need at least 6 characters.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    default:
      return error instanceof Error ? error.message : "Something went wrong. Please try again.";
  }
}
