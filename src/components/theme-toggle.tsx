"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = mounted ? theme ?? "system" : "system";
  const Icon = mounted && resolvedTheme === "light" ? Sun : Moon;

  if (compact) {
    return (
      <Button
        aria-label="Toggle theme"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        size="icon-sm"
        variant="ghost"
      >
        <Icon />
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border bg-card p-1">
      {OPTIONS.map((option) => (
        <button
          aria-label={option.label}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
            current === option.value && "bg-accent text-accent-foreground",
          )}
          key={option.value}
          onClick={() => setTheme(option.value)}
          type="button"
        >
          <option.icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
