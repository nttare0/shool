# 🎓 Student OS — v2

> Tasks, notes, flashcards, a focus timer and a whiteboard in one calm workspace.
> A ground-up redesign of [nttare/SCHOOL](https://github.com/nttare/SCHOOL) on **shadcn/ui** and **bklit** charts.

![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-087ea4?style=flat-square&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38b2ac?style=flat-square&logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-primitives-111?style=flat-square)
![bklit](https://img.shields.io/badge/bklit-charts-6d5efc?style=flat-square)
![Clerk](https://img.shields.io/badge/Clerk-sign%20in-6c47ff?style=flat-square)

---

## What changed in v2

The original app was a single 200 KB `index.html` plus a 207 KB `script.js` and 125 "patch" files loaded
via a Tailwind CDN. v2 is a proper React application with a typed data layer:

| | v1 (legacy) | v2 (this app) |
|---|---|---|
| Rendering | Static HTML + imperative DOM patching | Next.js App Router, React 19, server components |
| Styling | Tailwind CDN + 60 patch CSS files | Tailwind 4 + shadcn/ui primitives (base-ui) |
| Charts | Hand-rolled canvas/CSS | [bklit](https://bklit.com) shadcn registry components |
| State | Global mutable JS + localStorage | Typed store (`src/lib/store.tsx`) + localStorage |
| Data viz | none | area, bar, ring, gauge, radar, heatmap |

The original site is preserved untouched in [`legacy/`](./legacy) for reference.

## Screens

| Route | What's there |
|---|---|
| `/` | Marketing landing page with live bklit charts |
| `/dashboard` | Stats, focus-time area chart, daily-goal gauge, momentum bars, workload ring, streak heatmap, mastery radar |
| `/tasks` | Create / complete / delete tasks with subjects, priorities, due dates |
| `/notes` | Split-pane note editor with autosave and search |
| `/flashcards` | Leitner spaced repetition (5 boxes) with per-deck mastery |
| `/focus` | Pomodoro timer that logs sessions into your charts |
| `/whiteboard` | Pressure-friendly canvas with colours, eraser, undo/redo |
| `/settings` | Account + local storage, daily goal, subjects, export, reset |
| `/login` | Clerk sign-in, with local-mode fallback |

## Architecture

```
src/
├─ app/
│  ├─ (app)/               # authenticated-feeling shell (sidebar + topbar)
│  │  ├─ dashboard/ tasks/ notes/ flashcards/ focus/ whiteboard/ settings/
│  ├─ login/               # Clerk sign-in screen
│  ├─ layout.tsx           # providers: theme + store + fonts
│  └─ page.tsx             # landing page
├─ components/
│  ├─ charts/              # bklit chart components (vendored from the
│  │                       # bklit registry, MIT — see CREDITS below)
│  ├─ ui/                  # shadcn/ui primitives (base-ui based)
│  ├─ app-shell.tsx        # sidebar, topbar, mobile nav, storage status
│  └─ dashboard-charts.tsx # the chart panels wired to study data
└─ lib/
   ├─ types.ts             # Task, Note, Deck, FocusSession, …
   ├─ store.tsx            # context store + local persistence
   ├─ analytics.ts         # chart-ready aggregations
   └─ seed.ts              # sample workspace + subject palette
```

### Clerk and Supabase workspaces

Guest data remains in browser storage and is not imported automatically. Signed-in
users load a separate workspace protected by Supabase RLS using their Clerk subject.
Edits are saved after a short delay. The app blocks a cloud load if it detects a
local unsynced copy, allowing a backup download rather than overwriting it. Export
backups regularly: simultaneous edits on different devices are last-write-wins.
Existing Firebase documents are not modified or migrated.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

### Clerk setup

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
from the Clerk dashboard. Enable the desired sign-in methods in Clerk. Set the
same public key in Vercel for the desired deployment environments. Configure
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, enable
Clerk third-party auth in Supabase, and add `role: authenticated` to Clerk session
tokens. Apply the RLS migration to the Supabase project. The app uses
Clerk client components and does not need a secret key for server-side auth.
Test keys are for development; configure a production Clerk instance before
using real accounts. Account workspaces sync through Supabase when configured.

## Deploying

Deploy as a Next.js project on Vercel after setting the publishable key. Existing
Firebase-synced workspaces are not imported; export local copies before switching.

## Credits

- Original project: [nttare/SCHOOL](https://github.com/nttare/SCHOOL) — MIT, preserved in `legacy/`.
- UI primitives: [shadcn/ui](https://ui.shadcn.com) (base-ui flavour, from the bklit repo).
- Charts: [bklit](https://bklit.com) — MIT, `packages/ui` registry components vendored into `src/components/charts`.
- Icons: [lucide](https://lucide.dev). Fonts: Geist.

### Install on a device

Open the deployed HTTPS site and go to **Settings → Install Student OS**. Use
**Install app** when your browser offers it. In iOS Safari, choose Share → Add
to Home Screen; on Android or desktop, use the browser's install/Add to Home
Screen menu. This installs a web app, not an app-store download. The app needs
an internet connection to open; local workspace data is stored on that device.
Sign-in and account sync require the Clerk and Supabase setup above.
