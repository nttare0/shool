"use client";

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
    <div className="mb-4 rounded-xl border bg-card px-4 py-3 text-card-foreground">
      {now && (
        <time aria-label="Local time" className="text-lg font-semibold tabular-nums" dateTime={now.toISOString()}>
          {[now.getHours(), now.getMinutes(), now.getSeconds()]
            .map((part) => String(part).padStart(2, "0"))
            .join(":")}
        </time>
      )}
    </div>
  );
}
