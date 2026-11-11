"use client";

import * as React from "react";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { createEmptyState, createSeedState, SUBJECT_PALETTE, uid } from "./seed";
import type {
  AppState,
  Deck,
  Flashcard,
  FocusSession,
  Note,
  Priority,
  Stroke,
  Task,
} from "./types";

const STORAGE_KEY = "student-os.v2";

type AuthUser = { uid: string; email: string | null; name: string | null };

type StoreValue = {
  state: AppState;
  ready: boolean;
  user: AuthUser | null;
  signOut: () => Promise<void>;
  retrySync: () => void;
  syncStatus: "local" | "loading" | "saving" | "synced" | "error";
  syncError: string | null;

  addTask: (input: {
    title: string;
    subjectId: string | null;
    dueDate: string | null;
    priority: Priority;
  }) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addNote: (subjectId?: string | null) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  addDeck: (name: string, subjectId: string | null) => string;
  deleteDeck: (id: string) => void;
  addCard: (deckId: string, front: string, back: string) => void;
  reviewCard: (deckId: string, cardId: string, gotIt: boolean) => void;
  deleteCard: (deckId: string, cardId: string) => void;

  logSession: (minutes: number, taskId?: string | null) => void;
  setFocusGoal: (minutes: number) => void;

  setWhiteboard: (strokes: Stroke[]) => void;
  clearWhiteboard: () => void;

  addSubject: (name: string) => string;
  renameSubject: (id: string, name: string) => void;
  deleteSubject: (id: string) => void;
  resetToDemo: () => void;
  clearEverything: () => void;
  claimDemo: () => void;
};

const StoreContext = React.createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

function loadLocal(key: string): AppState | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(() => createEmptyState());
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const user = React.useMemo<AuthUser | null>(() => clerkUser ? ({
    uid: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
    name: clerkUser.fullName ?? clerkUser.firstName ?? null,
  }) : null, [clerkUser]);
  const scope = isLoaded ? (user?.uid ?? "guest") : null;
  const [loadedScope, setLoadedScope] = React.useState<string | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<StoreValue["syncStatus"]>("loading");
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [recovery, setRecovery] = React.useState<{ local: AppState; remote: AppState | null } | null>(null);
  const [retry, setRetry] = React.useState(0);
  const latest = React.useRef(0);
  const initialJson = React.useRef<string | null>(null);
  const writeQueue = React.useRef<Promise<void>>(Promise.resolve());
  const ready = scope !== null && loadedScope === scope;
  const client = React.useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return typeof window !== "undefined" && url && key ? createClient(url, key, { accessToken: async () => await getToken() }) : null;
  }, [getToken]);

  React.useEffect(() => {
    if (!scope) return;
    let cancelled = false;
    setLoadedScope(null);
    setSyncError(null);
    setRecovery(null);
    if (scope === "guest") {
      setState(loadLocal(STORAGE_KEY) ?? createSeedState());
      setSyncStatus("local");
      setLoadedScope(scope);
      return;
    }
    setSyncStatus("loading");
    (async () => {
      try {
        if (!client) throw new Error("Supabase is not configured.");
        const token = await getToken();
        if (!token) throw new Error("Your Clerk session is not ready. Please sign in again.");
        let claims: { role?: string };
        try { claims = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); }
        catch { throw new Error("Could not read the Clerk session token."); }
        if (claims.role !== "authenticated") throw new Error("Clerk session tokens need the role claim set to authenticated for Supabase. Ask the administrator to configure it in Clerk.");
        // Finish queued writes from the previous session before reading.
        await writeQueue.current;
        const { data, error } = await client.from("student_os_workspaces").select("state").eq("user_id", scope).maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        const remote = data?.state as AppState | undefined;
        if (remote && remote.version !== 2) throw new Error("Workspace format is not supported.");
        const local = loadLocal(`${STORAGE_KEY}.${scope}`);
        if (window.localStorage.getItem(`${STORAGE_KEY}.${scope}.pending`)) {
          if (!local) throw new Error("An unsynced local copy was marked but could not be read. Do not clear browser storage.");
          setRecovery({ local, remote: remote ?? null });
          setSyncStatus("error");
          setSyncError("Choose which workspace to keep. The copies may contain different changes.");
          return;
        }
        const initial = remote ?? createSeedState();
        initialJson.current = remote ? JSON.stringify(initial) : null;
        setState(initial);
        setLoadedScope(scope);
        setSyncStatus(remote ? "synced" : "saving");
      } catch (error) {
        if (cancelled) return;
        setSyncStatus("error");
        setSyncError(error && typeof error === "object" && "message" in error ? String(error.message) : "Could not load your cloud workspace.");
      }
    })();
    return () => { cancelled = true; };
  }, [scope, client, getToken]);

  React.useEffect(() => {
    if (!ready || !scope) return;
    try { window.localStorage.setItem(scope === "guest" ? STORAGE_KEY : `${STORAGE_KEY}.${scope}`, JSON.stringify(state)); } catch { /* storage can be unavailable */ }
    if (scope === "guest" || !client) return;
    if (JSON.stringify(state) === initialJson.current) return;
    try { window.localStorage.setItem(`${STORAGE_KEY}.${scope}.pending`, "1"); } catch { /* backup may be unavailable */ }
    const version = ++latest.current;
    setSyncStatus("saving");
    const timer = window.setTimeout(() => {
      writeQueue.current = writeQueue.current.then(async () => {
        const { error } = await client.from("student_os_workspaces").upsert({ user_id: scope, state, updated_at: new Date().toISOString() });
        if (error) throw error;
        if (latest.current === version) { try { window.localStorage.removeItem(`${STORAGE_KEY}.${scope}.pending`); } catch { /* optional */ } setSyncStatus("synced"); setSyncError(null); }
      }).catch((error) => {
        if (latest.current === version) {
          setSyncStatus("error");
          setSyncError(error && typeof error === "object" && "message" in error ? String(error.message) : "Could not save to Supabase.");
        }
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [state, ready, scope, client, retry]);

  const mutate = React.useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => ({ ...updater(prev), updatedAt: new Date().toISOString() }));
  }, []);

  const value = React.useMemo<StoreValue>(() => {
    return {
      state,
      ready,
      user,
      syncStatus,
      syncError,
      retrySync: () => setRetry((n) => n + 1),
      signOut: async () => {
        if ((syncStatus === "saving" || syncStatus === "error") && !window.confirm("Your changes may not be saved to the cloud. Sign out anyway?")) return;
        await signOut();
      },

      addTask: ({ title, subjectId, dueDate, priority }) =>
        mutate((prev) => ({
          ...prev,
          tasks: [
            {
              id: uid(),
              title: title.trim(),
              subjectId,
              dueDate,
              priority,
              done: false,
              createdAt: new Date().toISOString(),
              completedAt: null,
            },
            ...prev.tasks,
          ],
        })),

      toggleTask: (id) =>
        mutate((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  done: !task.done,
                  completedAt: !task.done ? new Date().toISOString() : null,
                }
              : task,
          ),
        })),

      updateTask: (id, patch) =>
        mutate((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
        })),

      deleteTask: (id) =>
        mutate((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== id) })),

      addNote: (subjectId = null) => {
        const id = uid();
        mutate((prev) => ({
          ...prev,
          notes: [
            {
              id,
              title: "Untitled note",
              subjectId,
              body: "",
              updatedAt: new Date().toISOString(),
            },
            ...prev.notes,
          ],
        }));
        return id;
      },

      updateNote: (id, patch) =>
        mutate((prev) => ({
          ...prev,
          notes: prev.notes.map((note) =>
            note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
          ),
        })),

      deleteNote: (id) =>
        mutate((prev) => ({ ...prev, notes: prev.notes.filter((note) => note.id !== id) })),

      addDeck: (name, subjectId) => {
        const id = uid();
        mutate((prev) => ({
          ...prev,
          decks: [...prev.decks, { id, name: name.trim(), subjectId, cards: [] }],
        }));
        return id;
      },

      deleteDeck: (id) =>
        mutate((prev) => ({ ...prev, decks: prev.decks.filter((deck) => deck.id !== id) })),

      addCard: (deckId, front, back) =>
        mutate((prev) => ({
          ...prev,
          decks: prev.decks.map((deck) =>
            deck.id === deckId
              ? {
                  ...deck,
                  cards: [
                    ...deck.cards,
                    {
                      id: uid(),
                      front: front.trim(),
                      back: back.trim(),
                      box: 0,
                      lastReviewed: null,
                    } satisfies Flashcard,
                  ],
                }
              : deck,
          ),
        })),

      reviewCard: (deckId, cardId, gotIt) =>
        mutate((prev) => ({
          ...prev,
          decks: prev.decks.map((deck) =>
            deck.id === deckId
              ? {
                  ...deck,
                  cards: deck.cards.map((card) =>
                    card.id === cardId
                      ? {
                          ...card,
                          box: gotIt ? Math.min(4, card.box + 1) : Math.max(0, card.box - 1),
                          lastReviewed: new Date().toISOString(),
                        }
                      : card,
                  ),
                }
              : deck,
          ),
        })),

      deleteCard: (deckId, cardId) =>
        mutate((prev) => ({
          ...prev,
          decks: prev.decks.map((deck) =>
            deck.id === deckId
              ? { ...deck, cards: deck.cards.filter((card) => card.id !== cardId) }
              : deck,
          ),
        })),

      logSession: (minutes, taskId = null) =>
        mutate((prev) => ({
          ...prev,
          sessions: [
            ...prev.sessions,
            {
              id: uid(),
              minutes,
              endedAt: new Date().toISOString(),
              taskId,
            } satisfies FocusSession,
          ],
        })),

      setFocusGoal: (minutes) =>
        mutate((prev) => ({ ...prev, focusGoalMinutes: Math.max(15, Math.round(minutes)) })),

      setWhiteboard: (strokes) => mutate((prev) => ({ ...prev, whiteboard: strokes.slice(-800) })),
      clearWhiteboard: () => mutate((prev) => ({ ...prev, whiteboard: [] })),

      addSubject: (name) => {
        const id = uid();
        mutate((prev) => ({
          ...prev,
          subjects: [
            ...prev.subjects,
            {
              id,
              name: name.trim(),
              color: SUBJECT_PALETTE[prev.subjects.length % SUBJECT_PALETTE.length],
            },
          ],
        }));
        return id;
      },

      renameSubject: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        mutate((prev) => ({
          ...prev,
          subjects: prev.subjects.map((subject) => subject.id === id ? { ...subject, name: trimmed } : subject),
        }));
      },
      deleteSubject: (id) => mutate((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((subject) => subject.id !== id),
        tasks: prev.tasks.map((task) => task.subjectId === id ? { ...task, subjectId: null } : task),
        notes: prev.notes.map((note) => note.subjectId === id ? { ...note, subjectId: null } : note),
        decks: prev.decks.map((deck) => deck.subjectId === id ? { ...deck, subjectId: null } : deck),
      })),

      resetToDemo: () => setState(createSeedState()),
      claimDemo: () => mutate((prev) => ({ ...prev, isDemo: false })),
      clearEverything: () => setState(createEmptyState()),
    };
  }, [state, ready, user, signOut, mutate, syncStatus, syncError]);

  function downloadCopy(copy: AppState, name: string) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!ready) return <main className="mx-auto max-w-lg p-8 text-sm">
    {syncStatus === "error" ? <div className="space-y-4">
      <h1 className="text-lg font-semibold">{recovery ? "Recover your workspace" : "Could not load your workspace"}</h1>
      <p>{syncError}</p>
      {recovery ? <>
        <p>Your browser has an unsynced copy{recovery.remote ? " and your account has a cloud copy" : "; no cloud copy was found"}. Download backups before choosing. Choosing one replaces the other; they are not merged.</p>
        <div className="flex flex-wrap gap-4">
          <button className="underline" onClick={() => downloadCopy(recovery.local, "student-os-local-backup.json")}>Download local backup</button>
          {recovery.remote && <button className="underline" onClick={() => downloadCopy(recovery.remote!, "student-os-cloud-backup.json")}>Download cloud backup</button>}
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" onClick={() => {
            if (!window.confirm("Save the local copy to your account? This replaces the cloud copy. Download backups first.")) return;
            setState(recovery.local); setLoadedScope(scope); setSyncStatus("saving"); setSyncError(null); setRecovery(null);
            // Force saving even if the two copies serialize identically.
            initialJson.current = null;
          }}>Save local copy to account</button>
          {recovery.remote && <button className="rounded-md border px-3 py-2" onClick={() => {
            if (!window.confirm("Use the cloud copy? The unsynced local changes will be replaced. Download a local backup first.")) return;
            try { localStorage.setItem(`${STORAGE_KEY}.${scope}`, JSON.stringify(recovery.remote)); localStorage.removeItem(`${STORAGE_KEY}.${scope}.pending`); } catch { setSyncError("Could not update browser storage. Download a backup and try again."); return; }
            initialJson.current = JSON.stringify(recovery.remote); setState(recovery.remote!); setLoadedScope(scope); setSyncStatus("synced"); setSyncError(null); setRecovery(null);
          }}>Use cloud copy</button>}
        </div>
      </> : <><p>Your local account copy, if available, remains in this browser. Do not clear browser storage.</p>
        {scope && scope !== "guest" && loadLocal(`${STORAGE_KEY}.${scope}`) && <button className="underline" onClick={() => downloadCopy(loadLocal(`${STORAGE_KEY}.${scope}`)!, "student-os-local-backup.json")}>Download local backup</button>}
        <button className="underline" onClick={() => window.location.reload()}>Retry</button></>}
      <button className="block underline" onClick={() => void signOut()}>Sign out</button>
    </div> : <p>Loading your workspace…</p>}
  </main>;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSubjects() {
  const { state } = useStore();
  return React.useMemo(() => {
    const map = new Map(state.subjects.map((s) => [s.id, s]));
    return {
      list: state.subjects,
      byId: (id: string | null) => (id ? map.get(id) ?? null : null),
      name: (id: string | null) => (id ? map.get(id)?.name ?? "General" : "General"),
      color: (id: string | null) => (id ? map.get(id)?.color ?? "var(--chart-1)" : "var(--muted-foreground)"),
    };
  }, [state.subjects]);
}

export function useDecksSummary() {
  const { state } = useStore();
  return React.useMemo(() => {
    const cards = state.decks.flatMap((deck: Deck) => deck.cards);
    const mastered = cards.filter((card) => card.box >= 3).length;
    return {
      decks: state.decks.length,
      cards: cards.length,
      mastered,
      due: cards.filter((card) => card.box < 2).length,
    };
  }, [state.decks]);
}
