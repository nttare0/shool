"use client";

import { ArrowLeft, ArrowRight, GraduationCap, Layers, ListChecks, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, signInEmail, signUpEmail, signInGoogle } = useStore();

  const [mode, setMode] = React.useState<Mode>("signin");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState<"google" | "email" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function handleEmail(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy("email");
    try {
      if (mode === "signin") await signInEmail(email, password);
      else await signUpEmail(email, password, name || undefined);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy("google");
    try {
      await signInGoogle();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r bg-sidebar p-10 lg:flex">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <Link className="relative flex items-center gap-2.5" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-sm font-semibold">Student OS</span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            One quiet place for the whole term.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to sync tasks, notes, flashcards and focus sessions across your laptop, phone
            and library computer.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: ListChecks, text: "Tasks with subjects, priorities and due dates" },
              { icon: Layers, text: "Spaced-repetition flashcards that track mastery" },
              { icon: Timer, text: "Focus sessions that feed your study charts" },
            ].map((item) => (
              <li className="flex items-center gap-3 text-muted-foreground" key={item.text}>
                <span className="grid size-8 place-items-center rounded-lg border bg-card text-primary">
                  <item.icon className="size-4" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-muted-foreground">
          Auth and storage by Firebase · UI by shadcn/ui · charts by bklit
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-4 sm:p-6">
          <Link
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            href="/"
          >
            <ArrowLeft className="size-3.5" /> Back to site
          </Link>
          <ThemeToggle compact />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-sm">
            <h2 className="text-xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to pick up where you left off."
                : "A few seconds and your workspace syncs everywhere."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
              {(["signin", "signup"] as Mode[]).map((option) => (
                <button
                  className={cn(
                    "rounded-md py-1.5 transition-colors",
                    mode === option
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  key={option}
                  onClick={() => {
                    setMode(option);
                    setError(null);
                  }}
                  type="button"
                >
                  {option === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <Button
              className="mt-4 w-full"
              disabled={busy !== null}
              onClick={handleGoogle}
              size="lg"
              variant="outline"
            >
              {busy === "google" ? <Spinner /> : <GoogleMark />}
              Continue with Google
            </Button>

            <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or use email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-3" onSubmit={handleEmail}>
              {mode === "signup" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ada Lovelace"
                    value={name}
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@school.edu"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  id="password"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">
                  {error}
                </p>
              ) : null}

              <Button className="w-full" disabled={busy !== null} size="lg" type="submit">
                {busy === "email" ? <Spinner /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight />
              </Button>
            </form>

            <div className="mt-5 rounded-xl border bg-card p-3">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                No account? Everything works offline first —{" "}
                <Link className="underline underline-offset-2 hover:text-foreground" href="/dashboard">
                  continue in local mode
                </Link>{" "}
                and your data stays in this browser until you decide to sync.
              </p>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Google sign-in needs this domain in Firebase → Authentication → Settings →
              Authorised domains. Email sign-in needs the Email/Password provider enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38Z"
        fill="#EA4335"
      />
    </svg>
  );
}
