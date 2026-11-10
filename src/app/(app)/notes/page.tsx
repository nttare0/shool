"use client";

import { FileText, NotebookPen, Plus, Search, Trash2 } from "lucide-react";
import * as React from "react";

import { PageHeading, Skeleton } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore, useSubjects } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const { state, ready, user, addNote, updateNote, deleteNote } = useStore();
  const subjects = useSubjects();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [draft, setDraft] = React.useState({ title: "", body: "" });

  const selected = state.notes.find((note) => note.id === selectedId) ?? null;

  // pick a note once data is ready
  React.useEffect(() => {
    if (!ready) return;
    if (!selectedId && state.notes.length) setSelectedId(state.notes[0].id);
    if (selectedId && !state.notes.some((note) => note.id === selectedId)) {
      setSelectedId(state.notes[0]?.id ?? null);
    }
  }, [ready, selectedId, state.notes]);

  // load draft when switching notes
  React.useEffect(() => {
    if (!selected) return;
    setDraft({ title: selected.title, body: selected.body });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // debounce writes back into the store
  React.useEffect(() => {
    if (!selected) return;
    if (draft.title === selected.title && draft.body === selected.body) return;
    const timer = window.setTimeout(() => {
      updateNote(selected.id, { title: draft.title || "Untitled note", body: draft.body });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, selected, updateNote]);

  const filtered = React.useMemo(() => {
    const list = [...state.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!query.trim()) return list;
    const needle = query.toLowerCase();
    return list.filter(
      (note) =>
        note.title.toLowerCase().includes(needle) || note.body.toLowerCase().includes(needle),
    );
  }, [state.notes, query]);

  function createNote() {
    const id = addNote(null);
    setSelectedId(id);
    setQuery("");
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-[28rem] w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        action={
          <Button onClick={createNote} size="sm">
            <Plus /> New note
          </Button>
        }
        description={`${state.notes.length} notes · changes save automatically`}
        title="Notes"
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* List */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes"
              value={query}
            />
          </div>

          <div className="scrollbar-slim max-h-[26rem] overflow-y-auto rounded-2xl border bg-card lg:max-h-[62vh]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <FileText className="size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {query ? "No notes match that search." : "No notes yet — create your first one."}
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((note) => {
                  const subject = subjects.byId(note.subjectId);
                  return (
                    <li key={note.id}>
                      <button
                        className={cn(
                          "w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                          note.id === selectedId && "bg-muted/60",
                        )}
                        onClick={() => setSelectedId(note.id)}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: subject?.color ?? "var(--muted-foreground)" }}
                          />
                          <span className="truncate text-sm font-medium">{note.title}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 pl-3.5 text-[11px] text-muted-foreground">
                          {note.body.replace(/\s+/g, " ").slice(0, 110) || "Empty note"}
                        </p>
                        <p className="mt-1 break-words pl-3.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                          {new Date(note.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                          {subject ? ` · ${subject.name}` : ""}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="rounded-2xl border bg-card">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                <Input
                  className="h-8 min-w-0 flex-1 border-none bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                  value={draft.title}
                />
                <select
                  className="h-8 max-w-full min-w-0 rounded-lg border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) =>
                    updateNote(selected.id, { subjectId: event.target.value || null })
                  }
                  value={selected.subjectId ?? ""}
                >
                  <option value="">General</option>
                  {state.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <Badge size="sm" variant="outline">
                  saved
                </Badge>
                <Button
                  aria-label="Delete note"
                  onClick={() => deleteNote(selected.id)}
                  size="icon-xs"
                  variant="ghost"
                >
                  <Trash2 />
                </Button>
              </div>
              <Textarea
                className="min-h-[22rem] flex-1 resize-none border-none bg-transparent p-4 text-sm leading-relaxed shadow-none focus-visible:ring-0 lg:min-h-[52vh]"
                onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))}
                placeholder="Start writing… markdown-ish lines, bullet points, whatever helps."
                value={draft.body}
              />
              <div className="flex flex-wrap items-center justify-between gap-1 border-t px-4 py-2 text-[11px] text-muted-foreground">
                <span>{draft.body.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>Autosaved on this device{user ? " + Firebase" : ""}</span>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-3 p-8 text-center">
              <NotebookPen className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No note selected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick one from the list or start a new note.
                </p>
              </div>
              <Button onClick={createNote} size="xs" variant="outline">
                <Plus /> New note
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
