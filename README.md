# GateFlow

A GATE-prep tracker built as a single Next.js app — frontend and API routes deploy
together on Vercel, backed by MongoDB.

- **Subjects → subtopics**, each subtopic tracked across three stages: **Concept, PYQs, Test**.
  Subject progress is the average completion across all its subtopics.
- **Tasks for any date** — not just today. Navigate forward/back or jump to a date.
- **Study timer** that logs sessions to today's total.
- **Streak** — a day only counts once you've logged **5 hours** of study that day (the default
  target; change `DAILY_TARGET_MINUTES` in `app/page.jsx` to adjust it).
- **Revision planning** — schedule a subject or a specific subtopic for a future date; overdue
  items are flagged.

```
app/
  page.jsx           the dashboard (client component)
  layout.jsx          root layout
  globals.css         styling
  api/                Next.js API routes — these run as Vercel serverless functions
    health/
    subjects/
    tasks/
    sessions/
    revisions/
components/            SubjectsPanel, TaskPlanner, Timer, StreakPanel, RevisionPlanner
lib/
  mongodb.js          cached DB connection (serverless-safe)
  serialize.js        ObjectId → string helpers
  api.js              client-side fetch wrapper (calls same-origin /api/*)
```

## Why Next.js instead of the separate Express server from before

Vercel is built around Next.js, so API routes and the frontend deploy as one project with
one `vercel deploy` (or one Git push) — no separate backend to host, no CORS to configure.
Each route under `app/api/**/route.js` becomes its own serverless function automatically.

## 1. Set up MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add an IP allowlist entry. For Vercel, add `0.0.0.0/0` (allow from
   anywhere), since serverless functions don't have a fixed IP.
4. **Connect → Drivers** → copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`

No manual schema setup is needed — collections (`subjects`, `tasks`, `study_sessions`,
`revisions`) are created automatically the first time you add data.

## 2. Run it locally

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=gateflow
```

```bash
npm run dev
```

Open `http://localhost:3000`. Check `http://localhost:3000/api/health` — it should return
`{"ok":true,"db":"connected"}`.

## 3. Deploy to Vercel

**Via the dashboard:**
1. Push this project to a GitHub repo.
2. [vercel.com/new](https://vercel.com/new) → import that repo. Next.js is auto-detected, no
   build settings to change.
3. Before the first deploy (or right after, then redeploy), go to **Project Settings →
   Environment Variables** and add:
   - `MONGODB_URI` — your Atlas connection string
   - `MONGODB_DB` — `gateflow` (or your preferred name)
4. Deploy. Visit `https://your-project.vercel.app/api/health` to confirm the DB connection.

**Via the CLI:**
```bash
npm i -g vercel
vercel login
vercel                     # first deploy, links the project
vercel env add MONGODB_URI
vercel env add MONGODB_DB
vercel --prod
```

## Data model

| Collection | Shape |
|---|---|
| `subjects` | `{ name, sort_order, subtopics: [{ name, concept_done, pyqs_done, test_done }] }` — subtopics are embedded documents |
| `tasks` | `{ task_date, text, done, subject_id, subtopic_id }` — `task_date` can be any date, past or future |
| `study_sessions` | `{ session_date, minutes }` — one row per logged timer session |
| `revisions` | `{ subject_id, subtopic_id, scheduled_date, done, notes }` |

## Notes on this being single-user

There's no login/auth here — anyone with your deployed URL and the ability to reach it can
read/write your data through the API routes. That's fine for personal use where the URL isn't
shared. If you ever want to share the link or make it multi-user, the natural next step is
adding auth (e.g. [NextAuth](https://authjs.dev) or Clerk) and scoping every Mongo query by a
`user_id` field — ask if you want that wired in.

## Extending it

Add a field to a document shape, read/write it in the relevant `app/api/**/route.js` file, then
wire it into the matching component. The client API wrapper in `lib/api.js` is the single place
that knows the endpoint shapes, so most new features only touch three files: a route, a
component, and that wrapper.
