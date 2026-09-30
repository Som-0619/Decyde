# Decyde

Stop debating in the group chat. Create a decision room, share the link, everyone swipes yes / no / meh, and the winner gets revealed the moment the votes are in — no sign-up, no accounts, ever.

Built with Next.js 14 (App Router), Supabase (Postgres + Realtime + Presence), and Tailwind.

## Features

- **Swipe-to-vote** — Tinder-style card stack, yes / no / meh per option
- **Zero login** — identity is a random ID generated in the browser's local storage; nothing personal is ever collected
- **Live everything** — votes, room status, and "N people here right now" all update in real time via Supabase Realtime Presence, both site-wide and per-room
- **Early finish** — a room closes and reveals the winner the moment every option's been voted on, instead of waiting out the full timer
- **Tie-breaker** — genuine ties get a short animated shuffle and a random pick among the tied options, shown honestly as "chosen via tiebreaker"
- **Streaks** — a lightweight daily voting streak tied to the same device-local ID
- **Rich link previews** — sharing a room link generates a real Open Graph image on the fly with that room's actual question and options
- **Rate-limited & RLS-hardened** — room creation and voting go through server routes with per-IP rate limiting; Postgres Row Level Security locks votes to insert-only and makes a room's question/duration immutable after creation
- **Cookie consent** — a real, honest privacy notice and an Accept/Decline choice that actually controls something (the optional streak feature), not just a decorative banner

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs fine without any setup — it falls back to session-only local storage when Supabase isn't configured, so you can poke around immediately.

### Connecting a real Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) — creates all tables, indexes, RLS policies, and the grants Supabase's SQL Editor doesn't add automatically
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL and anon/publishable key (**Project Settings → API**)
4. Restart the dev server

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS with a small shadcn-style token system (`components.json`, `components/ui`)
- **Backend**: Supabase — Postgres, Row Level Security, Realtime (postgres_changes + Presence)
- **Animation**: Framer Motion, canvas-confetti (loaded on demand)
- **Rate limiting**: in-memory per-IP sliding window on the API routes (`app/api/rooms`, `app/api/votes`) — no external service required
- **Link previews**: `next/og` for dynamic per-room Open Graph images

## Project structure

```
app/
  page.tsx                  landing page
  create/page.tsx            room-creation form
  room/[code]/                voting room (server wrapper + client UI + OG image)
  api/rooms, api/votes         rate-limited write endpoints
  api/log-error                 client-error reporting (shows up in server logs)
  privacy/page.tsx             privacy page
components/
  ui/sonar-grid.tsx            interactive dot-field background
  ...                          voting UI, modals, navbar, etc.
lib/
  supabaseClient.ts, streak.ts, presence.tsx, rateLimit.ts, cookieConsent.ts, ...
supabase/
  schema.sql                   full schema + RLS policies, safe to re-run
```
