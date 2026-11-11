"use client";

import {
  Check,
  CloudOff,
  Download,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  X,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { InstallApp } from "@/components/install-app";
import { PageHeading, Skeleton } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const {
    state,
    ready,
    user,
    syncStatus,
    syncError,
    retrySync,
    signOut,
    setFocusGoal,
    addSubject,
    renameSubject,
    deleteSubject,
    resetToDemo,
    clearEverything,
  } = useStore();

  const [goalDraft, setGoalDraft] = React.useState(String(state.focusGoalMinutes));
  const [subjectName, setSubjectName] = React.useState("");
  const [editingSubject, setEditingSubject] = React.useState<string | null>(null);
  const [subjectDraft, setSubjectDraft] = React.useState("");
  const [removingSubject, setRemovingSubject] = React.useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = React.useState(false);

  React.useEffect(() => setGoalDraft(String(state.focusGoalMinutes)), [state.focusGoalMinutes]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student-os-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading
        description="Account, sync, subjects and workspace data."
        title="Settings"
      />

      <InstallApp />

      {/* Account */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Account &amp; storage</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user
                ? `Signed in as ${user.email ?? user.uid} with Clerk.`
                : "You’re working locally on this device. Sign in with Clerk to use your account."}
            </p>
          </div>
          <Badge size="sm" variant="outline"><CloudOff /> {user ? syncStatus : "Local only"}</Badge>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{user ? "Your account workspace is saved to Supabase when sync succeeds. Guest data remains separate and is not automatically imported. Changes on multiple devices may overwrite each other; export backups regularly." : "Guest data stays in this browser and is separate from your account workspace."}</p>
        {syncError ? <div className="mt-2 text-xs text-destructive"><p>Sync failed: {syncError}. Export a backup before refreshing or signing out.</p><button className="mt-2 underline" onClick={retrySync}>Retry saving</button></div> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {user ? (
            <Button onClick={() => void signOut()} size="sm" variant="outline">
              <LogOut /> Sign out
            </Button>
          ) : (
            <Button render={<Link href="/login" />} size="sm">
              <LogIn /> Sign in
            </Button>
          )}
          <Button onClick={exportJson} size="sm" variant="outline">
            <Download /> Export data (JSON)
          </Button>
        </div>
      </section>

      {/* Focus goal */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Daily focus goal</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Used by the dashboard gauge and the sidebar progress bar.
        </p>
        <div className="mt-3 flex items-end gap-2">
          <div className="w-40 min-w-0">
            <Label className="text-[11px]" htmlFor="goal-minutes">
              Minutes per day
            </Label>
            <Input
              id="goal-minutes"
              max={480}
              min={15}
              onChange={(event) => setGoalDraft(event.target.value)}
              type="number"
              value={goalDraft}
            />
          </div>
          <Button onClick={() => setFocusGoal(Number(goalDraft) || 90)} size="sm" variant="outline">
            <Check /> Save
          </Button>
        </div>
      </section>

      {/* Subjects */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Subjects</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Colour-coded across tasks, notes, decks and charts.
        </p>

        <ul className="mt-4 divide-y rounded-xl border">
          {state.subjects.length === 0 && <li className="p-4 text-sm text-muted-foreground">No subjects yet. Add one below.</li>}
          {state.subjects.map((subject) => (
            <li className="flex flex-wrap items-center gap-2 px-3 py-2" key={subject.id}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
              {editingSubject === subject.id ? (
                <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" onSubmit={(event) => {
                  event.preventDefault();
                  if (!subjectDraft.trim()) return;
                  renameSubject(subject.id, subjectDraft);
                  setEditingSubject(null);
                }}>
                  <Input aria-label={`Rename ${subject.name}`} autoFocus className="h-8 max-w-xs" value={subjectDraft} onChange={(event) => setSubjectDraft(event.target.value)} />
                  <Button size="sm" type="submit" disabled={!subjectDraft.trim()}>Save</Button>
                  <Button size="icon-xs" variant="ghost" type="button" aria-label="Cancel rename" onClick={() => setEditingSubject(null)}><X /></Button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1 break-words text-sm">{subject.name}</span>
                  {removingSubject === subject.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">Tasks, notes and decks become General.</span>
                      <Button size="sm" variant="destructive" onClick={() => { deleteSubject(subject.id); setRemovingSubject(null); }}>Remove</Button>
                      <Button size="sm" variant="ghost" onClick={() => setRemovingSubject(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <Button size="icon-xs" variant="ghost" aria-label={`Rename ${subject.name}`} onClick={() => { setEditingSubject(subject.id); setSubjectDraft(subject.name); setRemovingSubject(null); }}><Pencil /></Button>
                      <Button size="icon-xs" variant="ghost" aria-label={`Remove ${subject.name}`} onClick={() => setRemovingSubject(subject.id)}><Trash2 /></Button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-end gap-2">
          <div className="w-56 min-w-0">
            <Label className="text-[11px]" htmlFor="subject-name">
              New subject
            </Label>
            <Input
              id="subject-name"
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Chemistry"
              value={subjectName}
            />
          </div>
          <Button
            disabled={!subjectName.trim()}
            onClick={() => {
              addSubject(subjectName);
              setSubjectName("");
            }}
            size="sm"
            variant="outline"
          >
            <Plus /> Add
          </Button>
        </div>
      </section>

      {/* Data */}
      <section className="rounded-2xl border border-destructive/25 bg-card p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-destructive" />
          <h2 className="text-sm font-semibold">Workspace data</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {state.isDemo
            ? "This workspace started from sample data."
            : "Everything here is yours — tasks, notes, decks, sessions and board strokes."}
        </p>

        <Separator className="my-4" />

        <div className="flex flex-wrap gap-2">
          <Button onClick={resetToDemo} size="sm" variant="outline">
            <RotateCcw /> Reload sample data
          </Button>
          {confirmWipe ? (
            <>
              <Button
                onClick={() => {
                  clearEverything();
                  setConfirmWipe(false);
                }}
                size="sm"
                variant="destructive"
              >
                <Trash2 /> Yes, delete everything
              </Button>
              <Button onClick={() => setConfirmWipe(false)} size="sm" variant="ghost">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmWipe(true)} size="sm" variant="destructive">
              <Trash2 /> Clear workspace
            </Button>
          )}
        </div>

      </section>
    </div>
  );
}
