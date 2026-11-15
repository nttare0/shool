"use client";

import { Clock3 } from "lucide-react";
import * as React from "react";

export function DashboardClock() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section aria-label="Local clock" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 text-card-foreground">
      <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Clock3 className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">Your local time</p>
        {now ? (
          <time className="text-lg font-semibold tabular-nums" dateTime={now.toISOString()}>
            {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </time>
        ) : (
          <span className="text-sm text-muted-foreground">Loading time…</span>
        )}
      </div>
      {now && (
        <span className="text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
      )}
    </section>
  );
}
