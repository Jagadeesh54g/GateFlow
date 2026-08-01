# GateFlow

A GATE-prep tracker built as a single Next.js app — frontend and API routes deploy
together on Vercel, backed by MongoDB. Supports multiple people, each with their own
private, password-protected data.

- **Accounts** — sign up with email/password, sign in, sign out. Passwords are hashed with
  bcrypt (one-way — nobody, including you as the operator, can recover the original password
  from the database). Every subject, task, session, revision, and document is scoped to the
  signed-in user; nobody can see or touch another account's data.
- **Subjects → subtopics**, each subtopic tracked across three stages: **Concept, PYQs, Test**.
  Subject progress is the average completion across all its subtopics.
- **Tasks for any date** — not just today. Navigate forward/back or jump to a date.
- **Study timer** that logs sessions to today's total, persists across refresh/tab close, and
  asks for confirmation before "Log & reset" so you can't accidentally wipe a day's progress.
- **Streak** — a day only counts once you've logged **5 hours** of study that day (the default
  target; change `DAILY_TARGET_MINUTES` in `app/page.jsx` to adjust it).
- **Revision planning** — schedule a subject or a specific subtopic for a future date; overdue
  items are flagged.
- **Documents** — attach syllabus copies, images, or PDFs to a subject (inside its expanded
  view) or exam-wide (in the "Exam documents" card). Each file has an editable "resume page"
  number (PDFs reopen at that page via the `#page=N` URL fragment) and a short notes field.
- **Quick links** — MadeEasy mock test series and PYQ practice, one click away.

```
app/
  page.jsx             the dashboard (client component, requires sign-in)
  layout.jsx           root layout
  globals.css          styling
  login/page.jsx        sign-in page
  register/page.jsx     sign-up page
  api/                 Next.js API routes — these run as Vercel serverless functions
    auth/
      [...nextauth]/    NextAuth handler (sessions, sign-in)
      register/         creates a new user (hashes password)
    health/
    subjects/
    tasks/
    sessions/
    revisions/
    documents/
components/             SubjectsPanel, TaskPlanner, Timer, StreakPanel, RevisionPlanner,
                        DocumentsPanel, QuickLinks, Providers (session context)
lib/
  mongodb.js            cached DB connection (serverless-safe)
  serialize.js          ObjectId → string helpers
  api.js                client-side fetch wrapper (calls same-origin /api/*)
  auth.js               NextAuth config (credentials provider, JWT sessions)
  hash.js                bcrypt password hashing
  session.js             requireUser() — every data route calls this to get the
                          current user or return 401
middleware.js            redirects signed-out visitors away from the dashboard
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
`revisions`, `documents`) are created automatically the first time you add data.

## 2. Set up Vercel Blob (for file uploads)

Documents (syllabus copies, subject files) are stored in Vercel Blob, not MongoDB — Mongo
documents cap out at 16MB and aren't built for binary file storage, while Blob is Vercel's
purpose-built object storage that plugs straight into your project.

**If deploying to Vercel:** Project → **Storage** tab → **Create Database** → **Blob** → connect
it to this project. Vercel auto-injects `BLOB_READ_WRITE_TOKEN` into your deployed environment —
no manual copying needed there.

**For local dev:** same Storage tab → your Blob store → **.env.local** tab → copy the token into
your local `.env.local` as `BLOB_READ_WRITE_TOKEN`.

Note: direct uploads through the API route are capped around **4.4MB** (Vercel serverless body
limit). That's plenty for a typical syllabus PDF or photo, but if you need to attach larger
scans, say so and I can wire up Vercel Blob's client-side direct-upload flow instead, which
bypasses that limit.

## 3. Set up authentication

Sign-in uses [NextAuth](https://authjs.dev) with a plain email/password (credentials)
provider — no third-party service or API keys needed, just one secret you generate yourself.

1. Generate a random secret:
   ```bash
   openssl rand -base64 32
   ```
   (No OpenSSL handy? Use [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32).)
2. Set it as `NEXTAUTH_SECRET` — in `.env.local` for local dev, or as a Vercel Environment
   Variable in production. This signs the login session tokens; treat it like a password.
3. Set `NEXTAUTH_URL` to wherever the app is served: `http://localhost:3000` locally, or your
   `https://your-project.vercel.app` URL in production.

That's it — no separate user database to provision. The first person to hit `/register`
creates the `users` collection automatically, with a unique index on email so two accounts
can't collide.

## 4. Run it locally

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=gateflow
BLOB_READ_WRITE_TOKEN=<from the Blob store's .env.local tab>
NEXTAUTH_SECRET=<from openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

```bash
npm run dev
```

Open `http://localhost:3000` — it'll redirect you to `/login`. Click through to `/register`
to create the first account. Check `http://localhost:3000/api/health` — it should return
`{"ok":true,"db":"connected"}`.

## 5. Deploy to Vercel

**Via the dashboard:**
1. Push this project to a GitHub repo.
2. [vercel.com/new](https://vercel.com/new) → import that repo. Next.js is auto-detected, no
   build settings to change.
3. Before the first deploy (or right after, then redeploy), go to **Project Settings →
   Environment Variables** and add:
   - `MONGODB_URI` — your Atlas connection string
   - `MONGODB_DB` — `gateflow` (or your preferred name)
   - `BLOB_READ_WRITE_TOKEN` — only needed if you didn't connect a Blob store via the Storage
     tab (that method injects it automatically)
   - `NEXTAUTH_SECRET` — your generated random secret
   - `NEXTAUTH_URL` — your production URL, e.g. `https://your-project.vercel.app`
4. Deploy. Visit `https://your-project.vercel.app/api/health` to confirm the DB connection,
   then `/register` to create the first account. Share the URL with anyone you want using
   it — they'll create their own account and only ever see their own data.

**Via the CLI:**
```bash
npm i -g vercel
vercel login
vercel                     # first deploy, links the project
vercel env add MONGODB_URI
vercel env add MONGODB_DB
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel --prod
```

## Data model

| Collection | Shape |
|---|---|
| `users` | `{ email (unique), password_hash, name }` — password_hash is a bcrypt hash, never the plain password |
| `subjects` | `{ user_id, name, sort_order, subtopics: [{ name, concept_done, pyqs_done, test_done }] }` — subtopics are embedded documents |
| `tasks` | `{ user_id, task_date, text, done, subject_id, subtopic_id }` — `task_date` can be any date, past or future |
| `study_sessions` | `{ user_id, session_date, minutes }` — one row per logged timer session |
| `revisions` | `{ user_id, subject_id, subtopic_id, scheduled_date, done, notes }` |
| `documents` | `{ user_id, subject_id (null = exam-wide), file_name, content_type, url, last_page, notes }` — the file itself lives in Vercel Blob; this just stores metadata + the blob URL |

Every collection except `users` carries a `user_id`, and every API route filters by
`requireUser().id` (see `lib/session.js`) before reading or writing anything — one person's
data is never visible to another, even if they guess an id.

## Notes on specific features

- **"Resume where I stopped" for documents**: the app doesn't track your scroll position
  automatically inside a PDF (browsers don't expose that to embedded pages). Instead, each
  document has an editable **"Resume pg"** number — type in the page you stopped at, and
  "Open" reopens the PDF at that page via the browser's built-in viewer (`#page=N` in the URL).
  It's a manual save point, not automatic tracking.
- **PYQ practice link**: I couldn't confirm the exact MadeEasy URL you meant by "practice paper
  GATE CS-IT" — `components/QuickLinks.jsx` currently points at their general GATE
  questions/solutions page as the closest match. Swap in the exact URL there if it's different.

## Notes on security

- **"Encryption" for accounts** means passwords are hashed with bcrypt before storage — a
  one-way transformation, not reversible encryption. This is the standard, arguably stronger
  approach for credentials: nobody (including you, running the database) can ever recover
  someone's actual password from the hash, only verify a guess against it.
- **Session tokens** are signed JWTs (via `NEXTAUTH_SECRET`), so they can't be forged without
  that secret. Keep it private — don't commit it, don't share it.
- **Data at rest**: MongoDB Atlas encrypts everything at the infrastructure level by default,
  independent of anything in this app.
- **What's not covered yet**: there's no "forgot password" flow, no email verification, and
  no rate-limiting on login attempts. Fine for a small group of people you know; if this ever
  gets a wider audience, those are the next things worth adding — ask if you want them.

## Extending it

Add a field to a document shape, read/write it in the relevant `app/api/**/route.js` file, then
wire it into the matching component. The client API wrapper in `lib/api.js` is the single place
that knows the endpoint shapes, so most new features only touch three files: a route, a
component, and that wrapper.
