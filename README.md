# Scrum Poker

A real-time Scrum Poker app built for the Pantyr full-stack developer assignment.

Users can create a session, join by code or invite link, vote with poker cards, keep estimates hidden during voting, reveal results, reset rounds and close sessions.

## Tech stack

**Frontend**
- React 18
- TypeScript
- Vite
- Apollo Client
- Tailwind CSS
- Playwright

**Backend**
- Node.js
- TypeScript
- Apollo Server
- GraphQL
- `graphql-ws`
- Vitest

## Features

- Create and join Scrum Poker sessions
- Submit estimates using poker cards
- Hide estimates until reveal
- Real-time session updates with GraphQL subscriptions
- Host controls for story title, story context, reveal, reset and close
- Responsive UI for desktop and mobile
- Backend unit tests and Playwright E2E tests

## Key business rule

Estimates are hidden until:

1. Every participant has voted, or
2. The host manually reveals the estimates.

This is handled by the backend, not just hidden in the frontend. Clients should not receive estimate values before they are allowed to be shown.

## Design decisions

**Persistence via flat JSON file (`tmp/db.json`)**
Sessions are persisted to disk using `lowdb-node` so a backend restart does not lose active sessions. A proper database would be the natural next step, but a file-based store avoids running infrastructure for a demo and keeps the setup to a single `npm install`. The file is `.gitignore`d so it never lands in version control.

**Host authorisation on all mutating operations**
`revealVotes`, `resetEstimates`, `setStoryTitle`, `setStoryContext`, and `closeSession` all verify that the calling participant is the session host. The frontend hides controls for non-hosts, but GraphQL mutations are always reachable directly, so the check is also done in the backend.

**Disconnect / leave handling**
When a participant closes their tab, the React cleanup effect calls the `leaveSession` mutation, which marks them `connected: false` in the service. The auto-reveal check (`every active participant has voted`) skips disconnected participants, so a ghost voter cannot permanently block a round. If the only unvoted participant disconnects, reveal fires automatically.

**Identity stored in `sessionStorage`**
Participant identity (`participantId`, `isHost`) is written to `sessionStorage` under `identity:<sessionId>` on first navigation and read back on subsequent renders, including page refresh. This means refreshing the session page works correctly without requiring a server round-trip. `sessionStorage` is scoped to the tab, so opening the same session in a second tab prompts a fresh join.

**Join-code collision protection**
`makeCode` regenerates until it finds a code not already in `sessionsByCode`, preventing a silent overwrite of an existing session. With a 6-character alphanumeric code space of ~900 million combinations the loop will practically never iterate more than once.

**Known limitation — `participantId` is unauthenticated**
There is no session token tied to a browser. Any client who knows a `sessionId` and `participantId` can submit mutations on behalf of that participant. A production fix would issue a short-lived signed token at join time and verify it on every mutation. Implementing this was deemed out of scope for the assignment.

## Running locally

### Prerequisites

- **Node.js v20+** — download from [nodejs.org](https://nodejs.org) (LTS recommended). This also installs `npm`.
- Verify after install:
  ```bash
  node -v   # should be v20.x.x or higher
  npm -v
  ```

### Step 1 — Install dependencies

Open two terminals (or run sequentially):

```bash
# Terminal 1 — backend
cd backend
npm install

# Terminal 2 — frontend
cd frontend
npm install
```

### Step 2 — Start the backend

```bash
cd backend
npm run dev
```

The API server starts at **http://localhost:4000/graphql**.

### Step 3 — Start the frontend

```bash
cd frontend\
npm run dev
```

Open **http://localhost:5173** in your browser.

Both servers must be running at the same time for the app to work.

## Running tests

### Backend unit tests

```bash
cd backend
npm test
```

### Frontend component unit tests (React Testing Library + Vitest)

```bash
cd frontend
npm test
```

### End-to-end tests (Playwright, headless)

Playwright automatically starts both servers before running, so no manual setup is needed:

```bash
cd frontend
npm run test:e2e
```

### End-to-end tests (headed — watch the browser)

```bash
cd frontend
npx playwright test --headed
```

### End-to-end tests (interactive UI mode)

```bash
cd frontend
npx playwright test --ui
```