"use client";

import { Coffee, Flame, Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react";
import * as React from "react";

import { GoalGauge } from "@/components/dashboard-charts";
import { PageHeading, Skeleton, StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dashboardSummary, formatMinutes, minutesByDay } from "@/lib/analytics";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const PRESETS = [15, 25, 45, 50];

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function FocusPage() {
  const { state, ready, logSession, setFocusGoal } = useStore();
  const [duration, setDuration] = React.useState(25);
  const [remaining, setRemaining] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const [justFinished, setJustFinished] = React.useState(false);
  const [goalDraft, setGoalDraft] = React.useState(String(state.focusGoalMinutes));

  const summary = React.useMemo(() => dashboardSummary(state), [state]);
  const series = React.useMemo(() => minutesByDay(state.sessions, 14), [state.sessions]);
  const todaySessions = React.useMemo(
    () =>
      state.sessions
        .filter(
          (session) => new Date(session.endedAt).toDateString() === new Date().toDateString(),
        )
        .sort((a, b) => b.endedAt.localeCompare(a.endedAt)),
    [state.sessions],
  );

  React.useEffect(() => {
    setGoalDraft(String(state.focusGoalMinutes));
  }, [state.focusGoalMinutes]);

  React.useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  React.useEffect(() => {
    if (remaining !== 0 || !running) return;
    setRunning(false);
    logSession(duration, null);
    setJustFinished(true);
    setRemaining(duration * 60);
    const timeout = window.setTimeout(() => setJustFinished(false), 6000);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  function pickPreset(minutes: number) {
    setDuration(minutes);
    setRemaining(minutes * 60);
    setRunning(false);
  }

  const progress = 1 - remaining / (duration * 60);
  const circumference = 2 * Math.PI * 92;
  const goalPct = Math.min(
    100,
    Math.round((summary.focusToday / Math.max(1, state.focusGoalMinutes)) * 100),
  );

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-[26rem] w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        description="A pomodoro-style timer that logs every finished session to your charts."
        title="Focus"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          accent="var(--chart-1)"
          hint={`${formatMinutes(summary.focusWeek)} in the last 7 days`}
          icon={TimerIcon}
          label="Focus today"
          value={formatMinutes(summary.focusToday)}
        />
        <StatCard
          accent="var(--chart-4)"
          hint={
            summary.streak > 0 ? "Keep the chain alive" : "Finish a session to start a streak"
          }
          icon={Flame}
          label="Streak"
          value={`${summary.streak}d`}
        />
        <StatCard
          accent="var(--chart-2)"
          hint={`${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} logged today`}
          icon={Coffee}
          label="Sessions"
          value={todaySessions.length}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((minutes) => (
                <button
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    duration === minutes
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  key={minutes}
                  onClick={() => pickPreset(minutes)}
                  type="button"
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <Badge size="sm" variant={running ? "success" : "outline"}>
              {running ? "running" : "paused"}
            </Badge>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="relative grid aspect-square w-full max-w-[220px] place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
                <circle
                  className="text-muted"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="92"
                  stroke="currentColor"
                  strokeWidth="10"
                />
                <circle
                  className="text-primary transition-[stroke-dashoffset] duration-500 ease-linear"
                  cx="100"
                  cy="100"
                  fill="none"
                  r="92"
                  stroke="currentColor"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  strokeLinecap="round"
                  strokeWidth="10"
                />
              </svg>
              <div className="text-center">
                <p className="font-mono text-4xl font-semibold tabular-nums">
                  {formatClock(remaining)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {running ? "focus in progress" : "ready when you are"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => setRunning((prev) => !prev)} size="lg">
                {running ? <Pause /> : <Play />}
                {running ? "Pause" : progress > 0 ? "Resume" : "Start"}
              </Button>
              <Button
                onClick={() => {
                  setRunning(false);
                  setRemaining(duration * 60);
                }}
                size="lg"
                variant="outline"
              >
                <RotateCcw /> Reset
              </Button>
              <Button onClick={() => logSession(duration, null)} size="lg" variant="ghost">
                Log {duration}m manually
              </Button>
            </div>

            {justFinished ? (
              <p className="mt-4 rounded-full bg-success/10 px-3 py-1 text-xs text-success-foreground">
                Nice — {duration} minutes logged. Take a breath.
              </p>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Daily goal</h2>
            <p className="text-xs text-muted-foreground">
              {formatMinutes(summary.focusToday)} of {formatMinutes(state.focusGoalMinutes)}
            </p>
            <GoalGauge
              goal={state.focusGoalMinutes}
              minutes={summary.focusToday}
              value={goalPct}
            />
            <div className="mt-2 flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-[11px]" htmlFor="goal">
                  Target minutes
                </Label>
                <Input
                  id="goal"
                  max={480}
                  min={15}
                  onChange={(event) => setGoalDraft(event.target.value)}
                  type="number"
                  value={goalDraft}
                />
              </div>
              <Button
                onClick={() => setFocusGoal(Number(goalDraft) || state.focusGoalMinutes)}
                size="sm"
                variant="outline"
              >
                Save
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Last 14 days</h2>
            <ul className="mt-3 space-y-1.5">
              {series.slice(-7).map((point) => {
                const max = Math.max(...series.map((item) => item.minutes), 1);
                return (
                  <li className="flex items-center gap-2 text-xs" key={point.date.toISOString()}>
                    <span className="w-9 shrink-0 text-muted-foreground">
                      {point.date.toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(point.minutes / max) * 100}%` }}
                      />
                    </span>
                    <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                      {point.minutes ? `${point.minutes}m` : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Today&apos;s sessions</h2>
          <span className="text-[11px] text-muted-foreground">
            {formatMinutes(todaySessions.reduce((sum, session) => sum + session.minutes, 0))} logged
          </span>
        </div>
        {todaySessions.length ? (
          <ul className="divide-y">
            {todaySessions.map((session) => (
              <li className="flex items-center gap-3 px-4 py-2.5 text-sm" key={session.id}>
                <TimerIcon className="size-4 text-muted-foreground" />
                <span>{session.minutes} minutes</span>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {new Date(session.endedAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No sessions yet today — the first one is the easiest.
          </p>
        )}
      </section>
    </div>
  );
}
