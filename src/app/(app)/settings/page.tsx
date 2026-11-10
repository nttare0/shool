"use client";

import {
  Check,
  Cloud,
  CloudOff,
  Download,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

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
    signOut,
    setFocusGoal,
    addSubject,
    resetToDemo,
    clearEverything,
  } = useStore();

  const [goalDraft, setGoalDraft] = React.useState(String(state.focusGoalMinutes));
  const [subjectName, setSubjectName] = React.useState("");
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
        description="Account, sync, subjects and the data living in your workspace."
        title="Settings"
      />

      {/* Account */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Account &amp; sync</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user
                ? `Signed in as ${user.email ?? user.uid}. Changes sync to Firestore automatically.`
                : "You're working locally on this device. Sign in to carry your workspace across devices."}
            </p>
          </div>
          <Badge
            size="sm"
            variant={
              !user
                ? "outline"
                : syncStatus === "synced"
                  ? "success"
                  : syncStatus === "error"
                    ? "error"
                    : "info"
            }
          >
            {user ? (
              <>
                {syncStatus === "synced" ? <Cloud /> : <CloudOff />}
                {syncStatus}
              </>
            ) : (
              "local mode"
            )}
          </Badge>
        </div>

        {syncError ? (
          <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
            {syncError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {user ? (
            <Button onClick={() => void signOut()} size="sm" variant="outline">
              <LogOut /> Sign out
            </Button>
          ) : (
            <Button render={<Link href="/login" />} size="sm">
              <LogIn /> Sign in to sync
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
          <div className="w-40">
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

        <ul className="mt-3 flex flex-wrap gap-2">
          {state.subjects.map((subject) => (
            <li
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
              key={subject.id}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: subject.color }} />
              {subject.name}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-end gap-2">
          <div className="w-56">
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
        {user ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Clearing also overwrites the copy stored in your Firebase account.
          </p>
        ) : null}
      </section>
    </div>
  );
}
