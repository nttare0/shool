import type { AppState, Deck, FocusSession, Subject, Task } from "./types";

export const DAY = 86_400_000;

export function startOfDay(date: Date | string = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isoDay(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function minutesByDay(sessions: FocusSession[], days: number) {
  const today = startOfDay();
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(isoDay(new Date(today.getTime() - i * DAY)), 0);
  }
  for (const session of sessions) {
    const key = isoDay(new Date(session.endedAt));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + session.minutes);
  }
  return Array.from(buckets, ([day, minutes]) => ({ date: new Date(`${day}T12:00:00`), minutes }));
}

export function focusMinutesToday(sessions: FocusSession[]) {
  const key = isoDay(new Date());
  return sessions
    .filter((session) => isoDay(new Date(session.endedAt)) === key)
    .reduce((total, session) => total + session.minutes, 0);
}

export function focusMinutesWeek(sessions: FocusSession[]) {
  const since = startOfDay().getTime() - 6 * DAY;
  return sessions
    .filter((session) => new Date(session.endedAt).getTime() >= since)
    .reduce((total, session) => total + session.minutes, 0);
}

/** Consecutive days (ending today or yesterday) that have at least one session. */
export function studyStreak(sessions: FocusSession[]) {
  const active = new Set(
    sessions.filter((session) => session.minutes >= 10).map((session) => isoDay(new Date(session.endedAt))),
  );
  const today = startOfDay();
  let cursor = active.has(isoDay(today)) ? today : new Date(today.getTime() - DAY);
  if (!active.has(isoDay(cursor))) return 0;

  let streak = 0;
  while (active.has(isoDay(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY);
  }
  return streak;
}

export function activeDays(sessions: FocusSession[]) {
  return new Set(sessions.map((session) => isoDay(new Date(session.endedAt)))).size;
}

export type TaskStats = {
  open: number;
  dueToday: number;
  overdue: number;
  completedToday: number;
  completedWeek: number;
  totalDone: number;
};

export function taskStats(tasks: Task[]): TaskStats {
  const today = isoDay(new Date());
  const weekAgo = startOfDay().getTime() - 6 * DAY;
  return {
    open: tasks.filter((task) => !task.done).length,
    dueToday: tasks.filter((task) => !task.done && task.dueDate === today).length,
    overdue: tasks.filter(
      (task) => !task.done && task.dueDate !== null && task.dueDate < today,
    ).length,
    completedToday: tasks.filter(
      (task) => task.done && task.completedAt && isoDay(new Date(task.completedAt)) === today,
    ).length,
    completedWeek: tasks.filter(
      (task) => task.done && task.completedAt && new Date(task.completedAt).getTime() >= weekAgo,
    ).length,
    totalDone: tasks.filter((task) => task.done).length,
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function completionsByWeekday(tasks: Task[], days = 7) {
  const since = startOfDay().getTime() - (days - 1) * DAY;
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(isoDay(new Date(startOfDay().getTime() - i * DAY)), 0);
  }
  for (const task of tasks) {
    if (!task.done || !task.completedAt) continue;
    const key = isoDay(new Date(task.completedAt));
    if (new Date(task.completedAt).getTime() >= since && buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return Array.from(buckets, ([day, completed]) => {
    const d = new Date(`${day}T12:00:00`);
    return { name: WEEKDAYS[d.getDay()], completed, day };
  });
}

export function tasksBySubject(tasks: Task[], subjects: Subject[]) {
  const counts = subjects.map((subject) => ({
    label: subject.name,
    value: tasks.filter((task) => !task.done && task.subjectId === subject.id).length,
    maxValue: 0,
    color: subject.color,
  }));
  const general = tasks.filter((task) => !task.done && !task.subjectId).length;
  if (general > 0)
    counts.push({ label: "General", value: general, maxValue: 0, color: "var(--muted-foreground)" });

  const visible = counts.filter((entry) => entry.value > 0);
  const max = Math.max(1, ...visible.map((entry) => entry.value));
  return visible.map((entry) => ({ ...entry, maxValue: max }));
}

/** Average Leitner box per subject, normalised to a 0–100 mastery score. */
export function masteryBySubject(decks: Deck[], subjects: Subject[]) {
  const metrics = subjects.map((subject) => ({
    key: subject.id,
    label: subject.name.length > 12 ? `${subject.name.slice(0, 11)}…` : subject.name,
  }));
  const values: Record<string, number> = {};
  for (const subject of subjects) {
    const cards = decks
      .filter((deck) => deck.subjectId === subject.id)
      .flatMap((deck) => deck.cards);
    values[subject.id] = cards.length
      ? Math.round((cards.reduce((sum, card) => sum + card.box, 0) / (cards.length * 4)) * 100)
      : 0;
  }
  return { metrics, data: [{ label: "Mastery", values }] };
}

/**
 * Heatmap data in the shape bklit expects: weeks (columns) of days (rows).
 * `weeks` includes the current, partially-elapsed week.
 */
export function heatmapWeeks(sessions: FocusSession[], weeks = 14) {
  const byDay = new Map<string, number>();
  for (const session of sessions) {
    const key = isoDay(new Date(session.endedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + session.minutes);
  }

  const today = startOfDay();
  const end = new Date(today);
  const start = new Date(today.getTime() - (weeks * 7 - 1) * DAY);
  // Align the first column to Sunday so rows read Mon→Sun consistently.
  start.setDate(start.getDate() - start.getDay());

  const out: { bin: number; bins: { bin: number; count: number; date: Date }[] }[] = [];
  let week = 0;
  for (let cursor = new Date(start); cursor <= end; cursor = new Date(cursor.getTime() + 7 * DAY)) {
    const bins = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(cursor.getTime() + dayIndex * DAY);
      const minutes = byDay.get(isoDay(date)) ?? 0;
      return { bin: dayIndex, count: date > end ? 0 : minutes, date };
    });
    out.push({ bin: week++, bins });
  }
  return out;
}

export function formatMinutes(total: number) {
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function relativeDue(dueDate: string | null) {
  if (!dueDate) return { label: "No due date", tone: "muted" as const };
  const today = isoDay(new Date());
  if (dueDate === today) return { label: "Today", tone: "warning" as const };
  const diff = Math.round((new Date(`${dueDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / DAY);
  if (diff === 1) return { label: "Tomorrow", tone: "info" as const };
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, tone: "destructive" as const };
  if (diff <= 7) return { label: `In ${diff}d`, tone: "muted" as const };
  return {
    label: new Date(`${dueDate}T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    tone: "muted" as const,
  };
}

export function dashboardSummary(state: AppState) {
  const stats = taskStats(state.tasks);
  const deckCards = state.decks.flatMap((deck) => deck.cards);
  return {
    stats,
    focusToday: focusMinutesToday(state.sessions),
    focusWeek: focusMinutesWeek(state.sessions),
    streak: studyStreak(state.sessions),
    activeDays: activeDays(state.sessions),
    cards: deckCards.length,
    cardsDue: deckCards.filter((card) => card.box < 2).length,
    mastered: deckCards.filter((card) => card.box >= 3).length,
  };
}
