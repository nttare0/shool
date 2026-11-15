"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localDateKey, occursOn } from "@/lib/calendar";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const field = "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm";

export function TimetableManager() {
  const { state, addScheduleEntry, deleteScheduleEntry } = useStore();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [repeat, setRepeat] = React.useState<"once" | "weekly">("weekly");
  const [until, setUntil] = React.useState("");
  const entries = state.schedule ?? [];

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !date || !start || !end || end <= start || (repeat === "weekly" && until && until < date)) return;
    addScheduleEntry({ title, date, startTime: start, endTime: end, repeat, until: repeat === "weekly" ? until || null : null });
    setTitle(""); setDate(""); setStart(""); setEnd(""); setUntil(""); setOpen(false);
  }

  return <section className="mt-4 rounded-xl border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="text-sm font-semibold">School timetable</h3><p className="text-xs text-muted-foreground">Classes are separate from tasks.</p></div>
      <Button size="xs" variant="outline" onClick={() => setOpen(!open)}><Plus /> {open ? "Close" : "Add class"}</Button>
    </div>
    {open && <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
      <label className="grid gap-1 text-xs font-medium">Class name<Input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mathematics" /></label>
      <label className="grid gap-1 text-xs font-medium">First date<Input required type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      <label className="grid gap-1 text-xs font-medium">Start time<Input required type="time" value={start} onChange={e => setStart(e.target.value)} /></label>
      <label className="grid gap-1 text-xs font-medium">End time<Input required type="time" value={end} onChange={e => setEnd(e.target.value)} /></label>
      <label className="grid gap-1 text-xs font-medium">Repeat<select className={field} value={repeat} onChange={e => setRepeat(e.target.value as "once" | "weekly")}><option value="weekly">Every week</option><option value="once">One time</option></select></label>
      {repeat === "weekly" && <label className="grid gap-1 text-xs font-medium">Last date (optional)<Input min={date || undefined} type="date" value={until} onChange={e => setUntil(e.target.value)} /></label>}
      {start && end && end <= start && <p className="text-xs text-destructive sm:col-span-2">End time must be after start time on the same day.</p>}
      <Button disabled={!title.trim() || !date || !start || !end || end <= start || Boolean(repeat === "weekly" && until && until < date)} className="sm:col-span-2 sm:justify-self-start" type="submit" size="sm">Save class</Button>
    </form>}
    {entries.length > 0 && <ul className="mt-3 divide-y">{entries.map(entry => <li className="flex items-center gap-3 py-2 text-sm" key={entry.id}>
      <div className="min-w-0 flex-1"><p className="break-words font-medium">{entry.title}</p><p className="text-xs text-muted-foreground">{entry.date} · {entry.startTime}–{entry.endTime} · {entry.repeat === "weekly" ? `Weekly${entry.until ? ` until ${entry.until}` : ""}` : "One time"}</p></div>
      <Button aria-label={`Delete ${entry.title} from timetable`} size="icon-xs" variant="ghost" onClick={() => { if (window.confirm(`Remove ${entry.title} from the timetable?`)) deleteScheduleEntry(entry.id); }}><Trash2 /></Button>
    </li>)}</ul>}
  </section>;
}

export function SchoolCalendar() {
  const { state } = useStore();
  const [selected, setSelected] = React.useState(() => localDateKey(new Date()));
  const [year, month] = selected.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const count = new Date(year, month, 0).getDate();
  const entries = state.schedule ?? [];
  const selectedTasks = state.tasks.filter(task => task.dueDate === selected);
  const selectedClasses = entries.filter(entry => occursOn(entry, selected)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  function moveMonth(offset: number) { setSelected(localDateKey(new Date(year, month - 1 + offset, 1))); }
  return <div>
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold">{first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
      <div className="flex gap-1"><Button aria-label="Previous month" size="icon-xs" variant="ghost" onClick={() => moveMonth(-1)}><ChevronLeft /></Button><Button aria-label="Next month" size="icon-xs" variant="ghost" onClick={() => moveMonth(1)}><ChevronRight /></Button></div>
    </div>
    <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <span className="py-1 text-muted-foreground" key={day}>{day}</span>)}
      {Array.from({ length: first.getDay() }, (_, i) => <span key={`blank-${i}`} />)}
      {Array.from({ length: count }, (_, i) => {
        const day = i + 1; const key = localDateKey(new Date(year, month - 1, day));
        const hasTask = state.tasks.some(task => task.dueDate === key);
        const hasClass = entries.some(entry => occursOn(entry, key));
        return <button key={key} type="button" aria-label={`${key}${hasTask ? ", tasks" : ""}${hasClass ? ", classes" : ""}`} aria-pressed={selected === key} onClick={() => setSelected(key)} className={cn("min-h-10 rounded-lg border border-transparent hover:bg-muted", selected === key && "border-primary bg-primary/10")}>
          <span>{day}</span><span className="flex h-2 justify-center gap-1">{hasTask && <span className="size-1 rounded-full bg-primary" />}{hasClass && <span className="size-1 rounded-full bg-chart-3" />}</span>
        </button>;
      })}
    </div>
    <p className="mt-2 text-[11px] text-muted-foreground">● Task &nbsp; <span className="text-chart-3">●</span> Class</p>
    <div className="mt-3 border-t pt-3"><h4 className="text-sm font-semibold">{new Date(year, month - 1, Number(selected.slice(-2))).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h4>
      {selectedTasks.length === 0 && selectedClasses.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Nothing planned for this day.</p>}
      <ul className="mt-2 space-y-2 text-sm">
        {selectedClasses.map(entry => <li key={entry.id} className="break-words"><span className="text-muted-foreground">{entry.startTime}–{entry.endTime} · Class</span> · {entry.title}</li>)}
        {selectedTasks.map(task => <li key={task.id} className="break-words"><Link className={cn("underline underline-offset-2", task.done && "line-through")} href="/tasks">{task.title}</Link> <span className="text-xs text-muted-foreground">· Task{task.done ? " · Done" : ""}</span></li>)}
      </ul>
    </div>
    <TimetableManager />
  </div>;
}
