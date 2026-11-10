"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Flame,
  Layers,
  ListChecks,
  Plus,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import {
  ChartFrame,
  CompletionsBarChart,
  FocusAreaChart,
  GoalGauge,
  MasteryRadarChart,
  StreakHeatmap,
  SubjectRingChart,
} from "@/components/dashboard-charts";
import { DemoBanner } from "@/components/demo-banner";
import { PageHeading, Skeleton, StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  completionsByWeekday,
  dashboardSummary,
  formatMinutes,
  heatmapWeeks,
  masteryBySubject,
  minutesByDay,
  relativeDue,
  tasksBySubject,
} from "@/lib/analytics";
import { useStore, useSubjects } from "@/lib/store";
import { cn } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { state, ready, user } = useStore();
  const subjects = useSubjects();

  const summary = React.useMemo(() => dashboardSummary(state), [state]);
  const focusSeries = React.useMemo(() => minutesByDay(state.sessions, 21), [state.sessions]);
  const weekday = React.useMemo(() => completionsByWeekday(state.tasks, 7), [state.tasks]);
  const bySubject = React.useMemo(
    () => tasksBySubject(state.tasks, state.subjects),
    [state.tasks, state.subjects],
  );
  const mastery = React.useMemo(
    () => masteryBySubject(state.decks, state.subjects),
    [state.decks, state.subjects],
  );
  const heat = React.useMemo(() => heatmapWeeks(state.sessions, 14), [state.sessions]);

  const upcoming = React.useMemo(
    () =>
      state.tasks
        .filter((task) => !task.done)
        .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
        .slice(0, 5),
    [state.tasks],
  );

  const goalPct = state.focusGoalMinutes
    ? Math.min(100, Math.round((summary.focusToday / state.focusGoalMinutes) * 100))
    : 0;

  const focusDelta = React.useMemo(() => {
    const last7 = focusSeries.slice(-7).reduce((sum, point) => sum + point.minutes, 0);
    const prev7 = focusSeries.slice(-14, -7).reduce((sum, point) => sum + point.minutes, 0);
    if (!prev7) return last7 ? "New this week" : "No sessions yet";
    const change = Math.round(((last7 - prev7) / prev7) * 100);
    return `${change >= 0 ? "+" : ""}${change}% vs last week`;
  }, [focusSeries]);

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-28" key={i} />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <DemoBanner />

      <PageHeading
        action={
          <div className="flex gap-2">
            <Button render={<Link href="/focus" />} size="sm" variant="outline">
              <Timer />
              Start focus
            </Button>
            <Button render={<Link href="/tasks" />} size="sm">
              <Plus />
              New task
            </Button>
          </div>
        }
        description={
          user
            ? `Signed in as ${user.email ?? "you"} — your account workspace can sync with Supabase.`
            : "Your workspace is saved on this device only."
        }
        title={`${greeting()}${user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="var(--chart-1)"
          hint={`${summary.stats.completedToday} completed today`}
          icon={ListChecks}
          label="Open tasks"
          value={summary.stats.open}
        />
        <StatCard
          accent="var(--chart-3)"
          hint={`${formatMinutes(summary.focusWeek)} this week`}
          icon={Timer}
          label="Focus today"
          value={formatMinutes(summary.focusToday)}
        />
        <StatCard
          accent="var(--chart-2)"
          hint={`${summary.mastered} of ${summary.cards} cards mastered`}
          icon={Layers}
          label="Cards to review"
          value={summary.cardsDue}
        />
        <StatCard
          accent="var(--chart-4)"
          hint={`${summary.activeDays} active days so far`}
          icon={Flame}
          label="Study streak"
          value={`${summary.streak}d`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartFrame
          action={
            <Badge size="sm" variant="outline">
              <TrendingUp /> {focusDelta}
            </Badge>
          }
          className="lg:col-span-2"
          description="Minutes logged per day over the last three weeks"
          title="Focus time"
        >
          <FocusAreaChart data={focusSeries} />
        </ChartFrame>

        <ChartFrame
          description={`${summary.focusToday} of ${state.focusGoalMinutes} minutes`}
          title="Daily goal"
        >
          <GoalGauge goal={state.focusGoalMinutes} minutes={summary.focusToday} value={goalPct} />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{goalPct}% complete</span>
            <Link className="inline-flex items-center gap-1 hover:text-foreground" href="/focus">
              Adjust <ArrowRight className="size-3" />
            </Link>
          </div>
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartFrame
          action={
            <Button render={<Link href="/tasks" />} size="xs" variant="ghost">
              All tasks <ArrowRight />
            </Button>
          }
          description="Sorted by what's due next"
          title="Up next"
        >
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarClock className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No open tasks. Enjoy the quiet.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {upcoming.map((task) => {
                const subject = subjects.byId(task.subjectId);
                const due = relativeDue(task.dueDate);
                return (
                  <li className="flex items-start gap-3 py-2.5" key={task.id}>
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: subject?.color ?? "var(--muted-foreground)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {subject?.name ?? "General"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        due.tone === "destructive" && "bg-destructive/10 text-destructive",
                        due.tone === "warning" && "bg-warning/15 text-warning-foreground",
                        due.tone === "info" && "bg-info/10 text-info-foreground",
                        due.tone === "muted" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {due.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartFrame>

        <ChartFrame description="Tasks completed per weekday" title="Momentum">
          <CompletionsBarChart data={weekday} />
        </ChartFrame>

        <ChartFrame description="Where your open tasks live" title="Workload split">
          {bySubject.length ? (
            <div className="flex items-center justify-center">
              <SubjectRingChart data={bySubject} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ListChecks className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Add a task to see the split.</p>
            </div>
          )}
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartFrame
          className="lg:col-span-2"
          description="Every cell is a day — darker means more focus minutes"
          title="Study consistency"
        >
          <StreakHeatmap data={heat} />
        </ChartFrame>

        <ChartFrame description="Average flashcard confidence per subject" title="Mastery">
          {mastery.metrics.length >= 3 ? (
            <div className="flex items-center justify-center">
              <MasteryRadarChart data={mastery.data} metrics={mastery.metrics} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Layers className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Add at least three subjects with cards to see the radar.
              </p>
            </div>
          )}
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartFrame
          action={
            <Button render={<Link href="/notes" />} size="xs" variant="ghost">
              All notes <ArrowRight />
            </Button>
          }
          description="Picked up where you left off"
          title="Recent notes"
        >
          {state.notes.length ? (
            <ul className="flex flex-col gap-2">
              {state.notes.slice(0, 3).map((note) => (
                <li key={note.id}>
                  <Link
                    className="flex items-start gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/40"
                    href="/notes"
                  >
                    <BookOpen className="mt-0.5 size-4 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{note.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {note.body.replace(/\s+/g, " ").slice(0, 96) || "Empty note"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No notes yet.</p>
          )}
        </ChartFrame>

        <ChartFrame
          action={
            <Button render={<Link href="/flashcards" />} size="xs" variant="ghost">
              Study <ArrowRight />
            </Button>
          }
          description="Decks ranked by cards waiting for you"
          title="Review queue"
        >
          {state.decks.length ? (
            <ul className="flex flex-col gap-2">
              {state.decks
                .map((deck) => ({
                  deck,
                  due: deck.cards.filter((card) => card.box < 2).length,
                }))
                .sort((a, b) => b.due - a.due)
                .slice(0, 3)
                .map(({ deck, due }) => (
                  <li
                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                    key={deck.id}
                  >
                    <Sparkles className="size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{deck.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {deck.cards.length} cards · {subjects.name(deck.subjectId)}
                      </p>
                    </div>
                    <Badge size="sm" variant={due > 0 ? "warning" : "success"}>
                      {due > 0 ? `${due} due` : "caught up"}
                    </Badge>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No decks yet.</p>
          )}
        </ChartFrame>
      </div>
    </div>
  );
}
