"use client";

import {
  ArrowLeft,
  CalendarDays,
  Cloud,
  CloudOff,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogIn,
  LogOut,
  NotebookPen,
  PenTool,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardSummary, formatMinutes } from "@/lib/analytics";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/whiteboard", label: "Whiteboard", icon: PenTool },
];

function useSyncLabel() {
  const { user, syncStatus } = useStore();
  if (!user) {
    return { text: "Local mode", icon: CloudOff, tone: "muted" as const, hint: "Sign in to sync across devices" };
  }
  switch (syncStatus) {
    case "synced":
      return { text: "Synced", icon: Cloud, tone: "success" as const, hint: `Signed in as ${user.email ?? "you"}` };
    case "syncing":
      return { text: "Syncing", icon: Loader2, tone: "info" as const, hint: "Saving to the cloud…" };
    case "error":
      return { text: "Sync issue", icon: CloudOff, tone: "warning" as const, hint: "Saved on this device only" };
    case "connecting":
      return { text: "Connecting", icon: Loader2, tone: "info" as const, hint: "Reaching Firebase…" };
    default:
      return { text: "Local mode", icon: CloudOff, tone: "muted" as const, hint: "Sign in to sync across devices" };
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, user, signOut } = useStore();
  const summary = React.useMemo(() => dashboardSummary(state), [state]);
  const sync = useSyncLabel();

  const active = NAV.find((item) => pathname?.startsWith(item.href));

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-[1560px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
          <Link className="flex items-center gap-2.5 px-2 pb-5" href="/">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <GraduationCap className="size-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Student OS</span>
              <span className="text-[11px] text-muted-foreground">v2 · shadcn + bklit</span>
            </span>
          </Link>

          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <item.icon
                    className={cn(
                      "size-4 opacity-70 transition-opacity group-hover:opacity-100",
                      isActive && "text-primary opacity-100",
                    )}
                  />
                  {item.label}
                  {item.href === "/tasks" && summary.stats.dueToday > 0 ? (
                    <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {summary.stats.dueToday}
                    </span>
                  ) : null}
                  {item.href === "/focus" && summary.focusToday >= state.focusGoalMinutes ? (
                    <span className="ml-auto text-[10px] text-success">done</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 px-2.5">
            <p className="pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Subjects
            </p>
            <ul className="flex flex-col gap-1.5">
              {state.subjects.slice(0, 5).map((subject) => {
                const open = state.tasks.filter(
                  (task) => !task.done && task.subjectId === subject.id,
                ).length;
                return (
                  <li className="flex items-center gap-2 text-xs text-muted-foreground" key={subject.id}>
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="truncate">{subject.name}</span>
                    <span className="ml-auto tabular-nums opacity-60">{open || ""}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <div className="rounded-xl border bg-card/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  Today
                </span>
                <span className="font-medium tabular-nums">
                  {formatMinutes(summary.focusToday)} / {formatMinutes(state.focusGoalMinutes)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (summary.focusToday / state.focusGoalMinutes) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {summary.streak > 0
                  ? `${summary.streak}-day study streak 🔥`
                  : "Log a session to start a streak"}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-xl border bg-card/60 px-3 py-2">
              <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground" title={sync.hint}>
                <sync.icon className={cn("size-3.5", sync.text === "Syncing" && "animate-spin")} />
                <span className="truncate">{sync.text}</span>
              </span>
              {user ? (
                <Button onClick={() => void signOut()} size="icon-xs" variant="ghost">
                  <LogOut />
                </Button>
              ) : (
                <Button render={<Link href="/login" />} size="xs" variant="ghost">
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
              <Link className="flex items-center gap-2 lg:hidden" href="/">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
                  <GraduationCap className="size-4" />
                </span>
                <span className="text-sm font-semibold">Student OS</span>
              </Link>

              <div className="hidden items-center gap-2 lg:flex">
                <span className="text-sm font-medium">{active?.label ?? "Dashboard"}</span>
                <Badge size="sm" variant={state.isDemo ? "warning" : "secondary"}>
                  {state.isDemo ? "sample data" : "your workspace"}
                </Badge>
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                <span
                  className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground sm:flex"
                  title={sync.hint}
                >
                  <sync.icon className={cn("size-3", sync.text === "Syncing" && "animate-spin")} />
                  {sync.text}
                </span>
                <ThemeToggle compact />
                {user ? (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground sm:block">
                      {user.email}
                    </span>
                    <Button onClick={() => void signOut()} size="xs" variant="outline">
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <Button render={<Link href="/login" />} size="xs" variant="outline">
                    <LogIn />
                    Sign in
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile nav */}
            <nav className="scrollbar-slim flex gap-1 overflow-x-auto border-t px-3 py-1.5 lg:hidden">
              {NAV.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground",
                      isActive && "bg-accent font-medium text-accent-foreground",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <item.icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>

          <footer className="border-t px-4 py-4 text-xs text-muted-foreground sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
              <span>Made with shadcn/ui + bklit charts</span>
              <Link className="inline-flex items-center gap-1 hover:text-foreground" href="/">
                <ArrowLeft className="size-3" /> Back to the landing page
              </Link>
              <Link className="ml-auto hover:text-foreground" href="/settings">
                Settings
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
