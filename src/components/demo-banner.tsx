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
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">You&apos;re looking at a sample workspace</p>
        <p className="text-xs text-muted-foreground">
          Tasks, notes and study sessions are pre-filled so the charts have something to show.
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button onClick={claimDemo} size="xs" variant="ghost">
          Keep samples
        </Button>
        <Button onClick={clearEverything} size="xs" variant="outline">
          Start empty
        </Button>
        <Button
          aria-label="Dismiss"
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
