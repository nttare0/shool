"use client";

import { Sparkles, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function DemoBanner() {
  const { state, claimDemo, clearEverything } = useStore();
  const [dismissed, setDismissed] = React.useState(false);

  if (!state.isDemo || dismissed) return null;

  return (
    <div className="relative mb-4 flex flex-wrap items-start gap-2 rounded-xl border border-primary/25 bg-primary/[0.06] p-3 sm:items-center sm:gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0 flex-1 pr-6 sm:pr-0">
        <p className="text-xs font-medium sm:text-sm">You&apos;re looking at a sample workspace</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">
          Tasks, notes and study sessions are pre-filled so the charts have something to show.
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center gap-1.5 pl-9 sm:w-auto sm:pl-0">
        <Button onClick={claimDemo} size="xs" variant="ghost">
          Keep samples
        </Button>
        <Button onClick={clearEverything} size="xs" variant="outline">
          Start empty
        </Button>
        <Button
          aria-label="Dismiss"
          className="absolute right-2 top-2 sm:static"
          onClick={() => setDismissed(true)}
          size="icon-xs"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
