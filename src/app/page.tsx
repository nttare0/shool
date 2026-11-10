"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Flame,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ListChecks,
  Moon,
  PenTool,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Timer,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { masteryBySubject, heatmapWeeks, minutesByDay } from "@/lib/analytics";
import { createSeedState } from "@/lib/seed";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Tasks that don't nag",
    body: "Subjects, priorities and due dates in one list. Overdue items quietly surface instead of shouting.",
  },
  {
    icon: BookOpen,
    title: "Notes with room to think",
    body: "A distraction-free editor with autosave, subject tags and instant search across every lecture.",
  },
  {
    icon: Layers,
    title: "Flashcards that adapt",
    body: "Leitner spaced repetition moves cards between five boxes, so you review what's actually slipping.",
  },
  {
    icon: Timer,
    title: "Focus sessions that count",
    body: "A pomodoro timer that logs every finished session straight into your study charts.",
  },
  {
    icon: PenTool,
    title: "A whiteboard for messy ideas",
    body: "Sketch diagrams, mind maps and timelines. Strokes save with the rest of your workspace.",
  },
  {
    icon: BarChart3,
    title: "Insight, not vanity metrics",
    body: "Streaks, mastery radar and workload splits built on bklit's chart primitives.",
  },
];

const STACK = [
  { name: "shadcn/ui", note: "interface primitives" },
  { name: "bklit", note: "charts & data viz" },
  { name: "Next.js", note: "app router" },
  { name: "Firebase", note: "auth + Firestore" },
  { name: "Vercel", note: "deploys" },
];

export default function LandingPage() {
  const router = useRouter();
  React.useEffect(() => {
    try {
      // A deliberate link back to the welcome page overrides the returning-visitor redirect.
      const welcome = new URLSearchParams(window.location.search).get("welcome") === "1";
      const hasVisited = window.localStorage.getItem("student-os.visited") === "1";
      const existingWorkspace = window.localStorage.getItem("student-os.v2");
      if (!welcome && (hasVisited || existingWorkspace)) router.replace("/dashboard");
    } catch {
      // Storage may be disabled; the welcome page remains available.
    }
  }, [router]);
  const seed = React.useMemo(() => createSeedState(), []);
  const focusSeries = React.useMemo(() => minutesByDay(seed.sessions, 21), [seed.sessions]);
  const weekday = React.useMemo(
    () => [
      { name: "Mon", completed: 4, day: "1" },
      { name: "Tue", completed: 6, day: "2" },
      { name: "Wed", completed: 3, day: "3" },
      { name: "Thu", completed: 7, day: "4" },
      { name: "Fri", completed: 5, day: "5" },
      { name: "Sat", completed: 2, day: "6" },
      { name: "Sun", completed: 4, day: "0" },
    ],
    [],
  );
  const heat = React.useMemo(() => heatmapWeeks(seed.sessions, 14), [seed.sessions]);
  const mastery = React.useMemo(
    () => masteryBySubject(seed.decks, seed.subjects),
    [seed.decks, seed.subjects],
  );
  const ring = React.useMemo(
    () => [
      { label: "Maths", value: 6, maxValue: 6, color: "var(--chart-1)" },
      { label: "Biology", value: 4, maxValue: 6, color: "var(--chart-2)" },
      { label: "History", value: 3, maxValue: 6, color: "var(--chart-3)" },
      { label: "CS", value: 2, maxValue: 6, color: "var(--chart-4)" },
    ],
    [],
  );

  return (
    <div className="min-h-svh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link className="flex items-center gap-2" href="/">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <GraduationCap className="size-4.5" />
            </span>
            <span className="text-sm font-semibold tracking-tight max-[320px]:hidden">Student OS</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 text-xs text-muted-foreground md:flex">
            <a className="rounded-md px-2.5 py-1.5 hover:bg-muted hover:text-foreground" href="#features">
              Features
            </a>
            <a className="rounded-md px-2.5 py-1.5 hover:bg-muted hover:text-foreground" href="#charts">
              Charts
            </a>
            <a className="rounded-md px-2.5 py-1.5 hover:bg-muted hover:text-foreground" href="#stack">
              Stack
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle compact />
            <Button render={<Link href="/dashboard" />} size="sm">
              Open the app
              <ArrowRight />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-18rem] size-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "conic-gradient(from 120deg, var(--chart-1), var(--chart-4), var(--chart-5), var(--chart-2), var(--chart-1))",
          }}
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mx-auto max-w-full text-center" size="lg" variant="outline">
              <Sparkles />
              Rebuilt with shadcn/ui + bklit charts
            </Badge>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              <span className="text-gradient">Your school life,</span>
              <br />
              in one calm dashboard.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Tasks, notes, flashcards, a focus timer and a whiteboard — five tools that share one
              workspace and actually respect your attention.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <Button render={<Link href="/dashboard" />} size="xl">
                Open the dashboard
                <ArrowRight />
              </Button>
              <Button render={<Link href="/login" />} size="xl" variant="outline">
                Sign in to sync
              </Button>
            </div>

            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-success" /> Works without an account
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Moon className="size-3.5" /> Dark mode by default
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="size-3.5" /> Installable PWA
              </span>
            </p>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto mt-12 max-w-5xl">
            <div className="overflow-hidden rounded-[1.4rem] border bg-card/80 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-4">
              <div className="flex items-center gap-1.5 pb-3">
                <span className="size-2.5 rounded-full bg-destructive/70" />
                <span className="size-2.5 rounded-full bg-warning/70" />
                <span className="size-2.5 rounded-full bg-success/70" />
                <span className="ml-3 hidden text-[10px] text-muted-foreground sm:block">
                  student-os / dashboard
                </span>
                <Badge className="ml-auto" size="sm" variant="secondary">
                  live preview
                </Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-xl border bg-background/70 p-4 lg:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium">Focus time</p>
                    <span className="text-[10px] text-muted-foreground">last 21 days</span>
                  </div>
                  <FocusAreaChart data={focusSeries} />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border bg-background/70 p-4">
                    <p className="mb-1 text-xs font-medium">Daily goal</p>
                    <GoalGauge goal={120} minutes={96} value={80} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border bg-background/70 p-3">
                      <Flame className="size-3.5 text-primary" />
                      <p className="mt-2 text-lg font-semibold tabular-nums">11d</p>
                      <p className="text-[10px] text-muted-foreground">streak</p>
                    </div>
                    <div className="rounded-xl border bg-background/70 p-3">
                      <Zap className="size-3.5 text-primary" />
                      <p className="mt-2 text-lg font-semibold tabular-nums">96m</p>
                      <p className="text-[10px] text-muted-foreground">today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 divide-x divide-border/60 px-4 sm:grid-cols-4 sm:px-6">
          {[
            { label: "Tools in one workspace", value: "5" },
            { label: "Ads or upsells", value: "0" },
            { label: "Chart types from bklit", value: "6" },
            { label: "Data kept on your device", value: "by default" },
          ].map((item) => (
            <div className="px-3 py-5 text-center" key={item.label}>
              <p className="text-lg font-semibold tracking-tight">{item.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24" id="features">
        <div className="max-w-2xl">
          <Badge size="sm" variant="outline">
            Features
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything a term needs. Nothing it doesn&apos;t.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Each tool is small on purpose — and they all write to the same store, so a task you
            finish shows up in your momentum chart straight away.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              className="group rounded-2xl border bg-card p-5 transition-colors hover:border-primary/30"
              key={feature.title}
            >
              <span className="grid size-9 place-items-center rounded-xl border bg-background text-primary transition-colors group-hover:bg-primary/10">
                <feature.icon className="size-4" />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="border-y bg-muted/20" id="charts">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <Badge size="sm" variant="outline">
                <BarChart3 /> Powered by bklit
              </Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Charts with a point of view
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Area, bar, ring, gauge, radar and heatmap components from bklit&apos;s shadcn
                registry — wired to real study data, not screenshots.
              </p>
            </div>
            <Button render={<Link href="/dashboard" />} size="sm" variant="outline">
              See them live <ArrowRight />
            </Button>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            <ChartFrame description="Focus minutes per day" title="Study rhythm">
              <FocusAreaChart data={focusSeries} />
            </ChartFrame>
            <ChartFrame description="Tasks completed by weekday" title="Momentum">
              <CompletionsBarChart data={weekday} />
            </ChartFrame>
            <ChartFrame description="Open tasks per subject" title="Workload">
              <div className="flex items-center justify-center">
                <SubjectRingChart data={ring} />
              </div>
            </ChartFrame>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <ChartFrame
              className="lg:col-span-2"
              description="A full study-streak heatmap, GitHub style"
              title="Consistency over the term"
            >
              <StreakHeatmap data={heat} />
            </ChartFrame>
            <ChartFrame description="Flashcard confidence per subject" title="Mastery radar">
              <div className="flex items-center justify-center">
                <MasteryRadarChart data={mastery.data} metrics={mastery.metrics} />
              </div>
            </ChartFrame>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24" id="stack">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Badge size="sm" variant="outline">
              Stack
            </Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Built the way modern front-ends are built
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The original Student OS was a single 200 KB HTML file with a Tailwind CDN. This is a
              clean re-platform onto React Server Components, shadcn/ui primitives and bklit charts
              — same features, considerably less chaos.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                { icon: Shield, text: "Firebase Auth (Google + email) with per-user Firestore docs" },
                { icon: LayoutDashboard, text: "Local-first: everything works before you sign in" },
                { icon: Smartphone, text: "Installable PWA manifest, theme-aware from the start" },
              ].map((item) => (
                <li className="flex items-start gap-3 text-muted-foreground" key={item.text}>
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border bg-card text-primary">
                    <item.icon className="size-3.5" />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3">
            {STACK.map((item) => (
              <div
                className="flex flex-col justify-between gap-6 rounded-2xl border bg-card p-4"
                key={item.name}
              >
                <span className="text-xs text-muted-foreground">{item.note}</span>
                <span className="text-sm font-semibold tracking-tight">{item.name}</span>
              </div>
            ))}
            <div className="flex flex-col justify-between gap-6 rounded-2xl border border-dashed p-4">
              <span className="text-xs text-muted-foreground">MIT licensed · original</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <Star className="size-4" /> nttare/SCHOOL
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 60% 90% at 50% 120%, var(--chart-1), transparent 70%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">
            Start the term with a clear desk.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            No sign-up wall, no onboarding quiz. Open the dashboard and it&apos;s already yours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button render={<Link href="/dashboard" />} size="xl">
              Open the dashboard <ArrowRight />
            </Button>
            <Button render={<Link href="/login" />} size="xl" variant="outline">
              Sync with Firebase
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-6 text-[11px] text-muted-foreground sm:px-6">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5" /> Student OS v2
          </span>
          <span>Forked from nttare/SCHOOL · MIT</span>
          <span className="ml-auto flex items-center gap-3">
            <Link className="hover:text-foreground" href="/dashboard">
              App
            </Link>
            <Link className="hover:text-foreground" href="/settings">
              Settings
            </Link>
            <Link className="hover:text-foreground" href="/login">
              Sign in
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
