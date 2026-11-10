"use client";

import * as React from "react";

import {
  type AuthUser,
  describeAuthError,
  isFirebaseConfigured,
  loadRemoteState,
  registerWithEmail,
  saveRemoteState,
  signInWithEmail,
  signInWithGoogle,
  signOutNow,
  watchAuth,
} from "./firebase";
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

export type SyncStatus = "local" | "connecting" | "syncing" | "synced" | "error";

type StoreValue = {
  state: AppState;
  ready: boolean;
  user: AuthUser | null;
  syncStatus: SyncStatus;
  syncError: string | null;

  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;

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

function loadLocal(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
  const [ready, setReady] = React.useState(false);
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>("local");
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const lastSyncedJson = React.useRef<string | null>(null);
  const hydrationDone = React.useRef(false);

  // ---- hydrate from localStorage (or seed a demo workspace) ----
  React.useEffect(() => {
    const local = loadLocal();
    setState(local ?? createSeedState());
    setReady(true);
    hydrationDone.current = true;
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota — ignore, the app still works in memory */
    }
  }, [state, ready]);

  const mutate = React.useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => ({ ...updater(prev), updatedAt: new Date().toISOString() }));
  }, []);

  // ---- auth + cloud sync ----
  React.useEffect(() => {
    if (!isFirebaseConfigured()) return;
    let unsub: (() => void) | undefined;
    let cancelled = false;

    watchAuth((nextUser) => {
      if (cancelled) return;
      setUser(nextUser);
      if (!nextUser) {
        setSyncStatus("local");
        setSyncError(null);
      }
    })
      .then((fn) => {
        if (cancelled) fn();
        else unsub = fn;
      })
      .catch(() => {
        /* Firebase unavailable — stay in local mode */
      });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  // Pull once per sign-in.
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setSyncStatus("connecting");

    (async () => {
      try {
        const remote = await loadRemoteState(user.uid);
        if (cancelled) return;
        const local = loadLocal() ?? createEmptyState();
        if (remote && !local.isDemo) {
          setState(remote);
        } else {
          const payload = remote && local.isDemo ? remote : local;
          setState(payload);
          await saveRemoteState(user.uid, payload);
        }
        lastSyncedJson.current = JSON.stringify(state);
        setSyncStatus("synced");
        setSyncError(null);
      } catch (error) {
        if (cancelled) return;
        setSyncStatus("error");
        setSyncError(
          error instanceof Error
            ? `Cloud sync unavailable (${error.message}). Your work is still saved on this device.`
            : "Cloud sync unavailable. Your work is still saved on this device.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Push debounced changes.
  React.useEffect(() => {
    if (!user || !ready || syncStatus === "error") return;
    const json = JSON.stringify(state);
    if (json === lastSyncedJson.current) return;

    const timer = window.setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        await saveRemoteState(user.uid, state);
        lastSyncedJson.current = json;
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
        setSyncError("Cloud sync failed — your changes are saved on this device.");
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [state, user, ready, syncStatus]);

  const value = React.useMemo<StoreValue>(() => {
    const guard = async (fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (error) {
        throw new Error(describeAuthError(error));
      }
    };

    return {
      state,
      ready,
      user,
      syncStatus,
      syncError,

      signInGoogle: () => guard(signInWithGoogle),
      signInEmail: (email, password) => guard(() => signInWithEmail(email, password)),
      signUpEmail: (email, password, name) => guard(() => registerWithEmail(email, password, name)),
      signOut: async () => {
        await signOutNow();
        setUser(null);
        setSyncStatus("local");
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
  }, [state, ready, user, syncStatus, syncError, mutate]);

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
