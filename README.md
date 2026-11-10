# 🎓 Student OS — v2

> Tasks, notes, flashcards, a focus timer and a whiteboard in one calm workspace.
> A ground-up redesign of [nttare/SCHOOL](https://github.com/nttare/SCHOOL) on **shadcn/ui** and **bklit** charts.

![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-087ea4?style=flat-square&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38b2ac?style=flat-square&logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-primitives-111?style=flat-square)
![bklit](https://img.shields.io/badge/bklit-charts-6d5efc?style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-auth%20%2B%20Firestore-ffca28?style=flat-square&logo=firebase&logoColor=000)

---

## What changed in v2

The original app was a single 200 KB `index.html` plus a 207 KB `script.js` and 125 "patch" files loaded
via a Tailwind CDN. v2 is a proper React application with a typed data layer:

| | v1 (legacy) | v2 (this app) |
|---|---|---|
| Rendering | Static HTML + imperative DOM patching | Next.js App Router, React 19, server components |
| Styling | Tailwind CDN + 60 patch CSS files | Tailwind 4 + shadcn/ui primitives (base-ui) |
| Charts | Hand-rolled canvas/CSS | [bklit](https://bklit.com) shadcn registry components |
| State | Global mutable JS + localStorage | Typed store (`src/lib/store.tsx`) + localStorage + Firestore |
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
| `/settings` | Account + sync, daily goal, subjects, export, reset |
| `/login` | Firebase Auth (Google + email), with local-mode fallback |

## Architecture

```
src/
├─ app/
│  ├─ (app)/               # authenticated-feeling shell (sidebar + topbar)
│  │  ├─ dashboard/ tasks/ notes/ flashcards/ focus/ whiteboard/ settings/
│  ├─ login/               # Firebase auth screen
│  ├─ layout.tsx           # providers: theme + store + fonts
│  └─ page.tsx             # landing page
├─ components/
│  ├─ charts/              # bklit chart components (vendored from the
│  │                       # bklit registry, MIT — see CREDITS below)
│  ├─ ui/                  # shadcn/ui primitives (base-ui based)
│  ├─ app-shell.tsx        # sidebar, topbar, mobile nav, sync pill
│  └─ dashboard-charts.tsx # the chart panels wired to study data
└─ lib/
   ├─ types.ts             # Task, Note, Deck, FocusSession, …
   ├─ store.tsx            # context store + persistence + Firebase sync
   ├─ firebase.ts          # lazy auth/Firestore client
   ├─ analytics.ts         # chart-ready aggregations
   └─ seed.ts              # sample workspace + subject palette
```

### Local-first, sync optional

Every page works before you sign in: state is written to `localStorage`
(`student-os.v2`) and the app starts with a sample workspace so the charts have
something to show. Signing in switches on Firestore sync — the whole state is
stored as one document at `students/{uid}/state/v2`, with a 1.2 s debounce and a
visible sync pill in the shell (local mode → syncing → synced / error).

When sync fails (offline, Firestore rules, disabled provider) the app keeps
working and tells you the data is saved on the device only.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

### Firebase (optional)

The app ships with the original Student OS Firebase project as the default.
Point it at your own project with env vars:

```bash
cp .env.example .env.local
# then fill in the values from Firebase → Project settings → Your apps → Web app
```

To make sign-in work end to end:

1. **Authentication → Sign-in method**: enable *Email/Password* (and *Google* if you want the Google button).
2. **Authentication → Settings → Authorised domains**: add `localhost` and your Vercel domain
   (`*.vercel.app` previews included).
3. **Firestore**: create a database and allow users to read/write their own document, e.g.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Deploying

The app is a standard Next.js project — `vercel` deploys it with zero config
(framework preset: Next.js, build: `npm run build`). Add the
`NEXT_PUBLIC_FIREBASE_*` env vars in the Vercel project settings if you use your
own Firebase project.

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
Sign-in and cross-device sync additionally require the Firebase setup above.
