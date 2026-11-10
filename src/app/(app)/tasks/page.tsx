"use client";

import { CalendarDays, Check, Circle, ListChecks, Plus, Trash2, X } from "lucide-react";
import * as React from "react";

import { PageHeading, Skeleton } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { relativeDue, taskStats } from "@/lib/analytics";
import { useStore, useSubjects } from "@/lib/store";
import type { Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "open" | "today" | "done" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "today", label: "Today" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
];

const PRIORITIES: { value: Priority; label: string; tone: string }[] = [
  { value: "low", label: "Low", tone: "text-muted-foreground" },
  { value: "medium", label: "Medium", tone: "text-info-foreground" },
  { value: "high", label: "High", tone: "text-destructive" },
];

export default function TasksPage() {
  const { state, ready, addTask, toggleTask, deleteTask } = useStore();
  const subjects = useSubjects();

  const [filter, setFilter] = React.useState<Filter>("open");
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [dueDate, setDueDate] = React.useState<string>("");
  const [priority, setPriority] = React.useState<Priority>("medium");

  const stats = taskStats(state.tasks);
  const today = new Date().toISOString().slice(0, 10);

  const visible = React.useMemo(() => {
    const sorted = [...state.tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31");
    });
    switch (filter) {
      case "today":
        return sorted.filter((task) => !task.done && task.dueDate === today);
      case "done":
        return sorted.filter((task) => task.done);
      case "all":
        return sorted;
      default:
        return sorted.filter((task) => !task.done);
    }
  }, [state.tasks, filter, today]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    addTask({
      title,
      subjectId: subjectId || null,
      dueDate: dueDate || null,
      priority,
    });
    setTitle("");
    setDueDate("");
    setComposerOpen(false);
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        action={
          <Button onClick={() => setComposerOpen((open) => !open)} size="sm">
            {composerOpen ? <X /> : <Plus />}
            {composerOpen ? "Close" : "New task"}
          </Button>
        }
        description={`${stats.open} open · ${stats.dueToday} due today · ${stats.overdue} overdue · ${stats.completedWeek} finished this week`}
        title="Tasks"
      />

      {composerOpen ? (
        <form
          className="mb-4 rounded-2xl border bg-card p-4 shadow-sm"
          onSubmit={submit}
        >
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-title">Task</Label>
              <Input
                autoFocus
                id="task-title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Finish calculus problem set 4"
                value={title}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-subject">Subject</Label>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                id="task-subject"
                onChange={(event) => setSubjectId(event.target.value)}
                value={subjectId}
              >
                <option value="">General</option>
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Priority</span>
              {PRIORITIES.map((option) => (
                <button
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs transition-colors",
                    priority === option.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted",
                  )}
                  key={option.value}
                  onClick={() => setPriority(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button disabled={!title.trim()} size="sm" type="submit">
              <Plus /> Add task
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((option) => (
          <button
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              filter === option.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted",
            )}
            key={option.value}
            onClick={() => setFilter(option.value)}
            type="button"
          >
            {option.label}
            <span className="ml-1.5 tabular-nums opacity-60">
              {option.value === "open"
                ? stats.open
                : option.value === "today"
                  ? stats.dueToday
                  : option.value === "done"
                    ? stats.totalDone
                    : state.tasks.length}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <ListChecks className="size-7 text-muted-foreground" />
            <p className="text-sm font-medium">Nothing here</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {filter === "done"
                ? "Completed tasks will collect here."
                : "Add a task and it will show up in this list."}
            </p>
            <Button className="mt-2" onClick={() => setComposerOpen(true)} size="xs" variant="outline">
              <Plus /> New task
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {visible.map((task) => {
              const subject = subjects.byId(task.subjectId);
              const due = relativeDue(task.dueDate);
              return (
                <li
                  className={cn(
                    "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                    task.done && "opacity-60",
                  )}
                  key={task.id}
                >
                  <button
                    aria-label={task.done ? "Mark as open" : "Mark as done"}
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                      task.done
                        ? "border-success bg-success/15 text-success"
                        : "border-input text-transparent hover:border-primary hover:text-primary/50",
                    )}
                    onClick={() => toggleTask(task.id)}
                    type="button"
                  >
                    {task.done ? <Check className="size-3" /> : <Circle className="size-3" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={cn("break-words text-sm", task.done && "line-through")}>{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex min-w-0 items-center gap-1 break-all">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: subject?.color ?? "var(--muted-foreground)" }}
                        />
                        {subject?.name ?? "General"}
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-1 break-all">
                        <CalendarDays className="size-3" />
                        {due.label}
                      </span>
                      <Badge
                        size="sm"
                        variant={
                          task.priority === "high"
                            ? "error"
                            : task.priority === "medium"
                              ? "info"
                              : "outline"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    aria-label="Delete task"
                    className="sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => deleteTask(task.id)}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
