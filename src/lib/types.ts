export type Priority = "low" | "medium" | "high";

export interface Subject {
  id: string;
  name: string;
  /** CSS color used for dots, rings and chips. */
  color: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string | null;
  /** ISO date, `yyyy-mm-dd`. */
  dueDate: string | null;
  priority: Priority;
  done: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface Note {
  id: string;
  title: string;
  subjectId: string | null;
  body: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  /** Leitner box, 0 (new) → 4 (mastered). */
  box: number;
  lastReviewed: string | null;
}

export interface Deck {
  id: string;
  name: string;
  subjectId: string | null;
  cards: Flashcard[];
}

export interface FocusSession {
  id: string;
  minutes: number;
  /** ISO timestamp of when the session finished. */
  endedAt: string;
  taskId: string | null;
}

export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  erase: boolean;
}

export interface AppState {
  version: 2;
  subjects: Subject[];
  tasks: Task[];
  notes: Note[];
  decks: Deck[];
  sessions: FocusSession[];
  whiteboard: Stroke[];
  focusGoalMinutes: number;
  /** Marks state that was seeded with sample data. */
  isDemo: boolean;
  updatedAt: string;
}
