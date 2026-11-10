import type { AppState, Deck, FocusSession, Note, Subject, Task } from "./types";

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (days: number, from = new Date()) => {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

export const SUBJECT_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const subjects: Subject[] = [
  { id: "sub-math", name: "Mathematics", color: "var(--chart-1)" },
  { id: "sub-bio", name: "Biology", color: "var(--chart-2)" },
  { id: "sub-hist", name: "History", color: "var(--chart-3)" },
  { id: "sub-cs", name: "Computer Science", color: "var(--chart-4)" },
  { id: "sub-lit", name: "Literature", color: "var(--chart-5)" },
];

const taskSeeds: Array<[string, string, number, Task["priority"], boolean]> = [
  ["Finish calculus problem set 4", "sub-math", 0, "high", false],
  ["Read chapter 7 — cell respiration", "sub-bio", 0, "medium", false],
  ["Draft essay outline: Cold War", "sub-hist", 0, "high", false],
  ["Submit CS lab 3 reflection", "sub-cs", 0, "medium", true],
  ["Review flashcards: organic chemistry", "sub-bio", 1, "medium", false],
  ["Practice integration by parts", "sub-math", 1, "low", false],
  ["Annotate 'The Trial' chapter 3", "sub-lit", 2, "low", false],
  ["Group project sync notes", "sub-cs", 2, "medium", false],
  ["Summarise lecture 12 — WWII", "sub-hist", 3, "low", false],
  ["Rebuild linked-list exercise", "sub-cs", -1, "high", true],
  ["Biology quiz corrections", "sub-bio", -1, "medium", true],
  ["Read 20 pages of 'The Trial'", "sub-lit", -2, "low", true],
  ["Problem set 3 review", "sub-math", -2, "medium", true],
  ["History primary source notes", "sub-hist", -3, "low", true],
  ["CS lecture recap — recursion", "sub-cs", -4, "low", true],
  ["Lab safety reading", "sub-bio", -4, "low", true],
];

const tasks: Task[] = taskSeeds.map(([title, subjectId, offset, priority, done], i) => {
  const created = shift(-6 - (i % 5));
  return {
    id: `task-${i}`,
    title,
    subjectId,
    dueDate: iso(shift(offset)),
    priority,
    done,
    createdAt: created.toISOString(),
    completedAt: done ? shift(-(i % 6) - 0.5).toISOString() : null,
  };
});

const notes: Note[] = [
  {
    id: "note-1",
    title: "Cell respiration — the short version",
    subjectId: "sub-bio",
    body: `Glycolysis → 2 ATP, 2 NADH, pyruvate.
Krebs cycle → matrix of the mitochondrion, 2 ATP + NADH/FADH2.
Electron transport chain → ~26–28 ATP, oxygen is the final acceptor.

Exam prompt: explain why cyanide is lethal (blocks complex IV, halts the chain, ATP production collapses).`,
    updatedAt: shift(-0.4).toISOString(),
  },
  {
    id: "note-2",
    title: "Cold War essay — thesis ideas",
    subjectId: "sub-hist",
    body: `Working thesis: containment was less a strategy than an improvisation that hardened into a global system.

Evidence to pull: Long Telegram (1946), NSC-68, Marshall Plan, Berlin airlift, Cuban missile crisis.
Counter-argument: Soviet archives show genuine fear of encirclement, not only expansionism.`,
    updatedAt: shift(-1.2).toISOString(),
  },
  {
    id: "note-3",
    title: "Integration by parts — pattern log",
    subjectId: "sub-math",
    body: `∫u dv = uv − ∫v du

Choose u: LIATE (Log, Inverse trig, Algebraic, Trig, Exponential).
Stock examples: x·e^x, x·sin x, ln x, x^2·e^x.

Trap: forgetting that a "missing" integrand means u = ln x and dv = dx.`,
    updatedAt: shift(-2.6).toISOString(),
  },
];

const decks: Deck[] = [
  {
    id: "deck-1",
    name: "Bio: respiration & photosynthesis",
    subjectId: "sub-bio",
    cards: [
      { id: "c1", front: "Where does glycolysis happen?", back: "In the cytosol — no oxygen required.", box: 2, lastReviewed: shift(-1).toISOString() },
      { id: "c2", front: "Final electron acceptor in the ETC?", back: "Oxygen — it forms water when it accepts electrons.", box: 1, lastReviewed: shift(-2).toISOString() },
      { id: "c3", front: "Net ATP from one glucose molecule?", back: "About 30–32 ATP in aerobic respiration.", box: 0, lastReviewed: null },
      { id: "c4", front: "What does the Calvin cycle fix?", back: "CO₂, using ATP and NADPH from the light reactions.", box: 3, lastReviewed: shift(-4).toISOString() },
    ],
  },
  {
    id: "deck-2",
    name: "Math: derivatives & integrals",
    subjectId: "sub-math",
    cards: [
      { id: "c5", front: "d/dx of ln(x)?", back: "1/x", box: 3, lastReviewed: shift(-1).toISOString() },
      { id: "c6", front: "Derivative of sin(x)·cos(x)?", back: "cos²(x) − sin²(x) = cos(2x)", box: 1, lastReviewed: shift(-3).toISOString() },
      { id: "c7", front: "∫ e^(2x) dx?", back: "½ e^(2x) + C", box: 0, lastReviewed: null },
    ],
  },
  {
    id: "deck-3",
    name: "CS: data structures",
    subjectId: "sub-cs",
    cards: [
      { id: "c8", front: "Average lookup in a hash table?", back: "O(1) — O(n) in the worst case with collisions.", box: 2, lastReviewed: shift(-2).toISOString() },
      { id: "c9", front: "When is a heap better than a sorted array?", back: "When you repeatedly need the min/max while inserting — O(log n) instead of O(n).", box: 0, lastReviewed: null },
    ],
  },
];

/**
 * A seeded pseudo-random generator so the sample charts look the same on every
 * fresh load instead of jumping around between sessions.
 */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const sessions: FocusSession[] = (() => {
  const rng = makeRng(20261_019);
  const out: FocusSession[] = [];
  for (let dayOffset = -44; dayOffset <= 0; dayOffset++) {
    const weekday = shift(dayOffset).getDay();
    const skip = weekday === 0 && rng() > 0.5;
    const count = skip ? 0 : 1 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const minutes = [25, 25, 45, 50, 15][Math.floor(rng() * 5)];
      const ended = shift(dayOffset);
      ended.setHours(9 + i * 2, Math.floor(rng() * 60), 0, 0);
      out.push({
        id: `sess-${dayOffset}-${i}`,
        minutes,
        endedAt: ended.toISOString(),
        taskId: null,
      });
    }
  }
  return out;
})();

export function createSeedState(): AppState {
  return {
    version: 2,
    subjects,
    tasks,
    notes,
    decks,
    sessions,
    whiteboard: [],
    focusGoalMinutes: 120,
    isDemo: true,
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyState(): AppState {
  return {
    version: 2,
    subjects: subjects.slice(0, 3),
    tasks: [],
    notes: [],
    decks: [],
    sessions: [],
    whiteboard: [],
    focusGoalMinutes: 90,
    isDemo: false,
    updatedAt: new Date().toISOString(),
  };
}
