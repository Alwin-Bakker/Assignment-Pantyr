# Scrum Poker

A real-time Scrum Poker app built for the Pantyr full-stack developer assignment.

Users can create a session, join by code or invite link, vote with poker cards, keep estimates hidden while voting is in progress, reveal results, pick official story points, and track completed stories across the session.

## Tech stack

**Frontend**

- React 18
- TypeScript
- Vite
- Apollo Client
- Tailwind CSS
- Playwright (E2E), Vitest + React Testing Library (unit)

**Backend**

- Node.js
- TypeScript
- Apollo Server (Express)
- GraphQL with `graphql-ws` subscriptions
- Vitest (unit)

## Features

- Create and join Scrum Poker sessions via 6-character code or invite link
- Submit estimates using standard poker cards (0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100, ?, ∞, ☕)
- **Estimates stay hidden while voting is in progress** — values are only shown after the host explicitly reveals them
- Host can reveal votes early (with a confirmation prompt if not everyone has voted yet)
- Disconnected participants are marked as such so that the process does not grind to a halt when this happens
- After reveal, the host picks the official story points for the current story
- Picking story points saves the story (title + estimate) to a completed-stories list visible to all participants, then clears the board and resets voting for the next story
- Host controls: set story title, set story context, reveal, reset round, close session
- Real-time updates via GraphQL subscriptions
- Responsive UI for desktop and mobile

## Key business rules

- Estimates are hidden until the host reveals the votes. The host receives a confirmation prompt if any participant has not yet voted.
- Only the host can call mutating operations (`revealVotes`, `resetEstimates`, `pickStoryPoints`, `setStoryTitle`, `setStoryContext`, `closeSession`). This is enforced on the backend; the frontend only hides the controls.
- A story is saved to the completed list only when it has a title at the time the host picks its points.

## Design decisions

**Persistence via flat JSON file (`tmp/db.json`)**
Sessions are persisted to disk using `lowdb-node` so a backend restart does not lose active sessions. A proper database would be the natural next step, but a file-based store avoids running infrastructure for a demo. The file is `.gitignore`d and never lands in version control.

**Host authorisation on every mutating operation**
All state-changing mutations verify the calling participant is the session host. The frontend hides controls for non-hosts, but GraphQL mutations are always directly reachable, so the check is enforced in the service layer too.

**Disconnect / leave handling**
When a participant closes their tab a `keepalive` fetch fires the `leaveSession` mutation, marking them `connected: false`. Their entry stays visible in the participant list with a "Left" badge so other participants can see they are gone. Disconnected participants are excluded from the "all voted?" check in the reveal-confirmation dialog. On page refresh the participant is automatically reconnected: a second `reconnectParticipant` call fires once the session data resolves, which is guaranteed to complete after any in-flight keepalive from the previous unload, preventing a false "Left" badge after refresh.

**Identity stored in `sessionStorage`**
Participant identity (`participantId`, `isHost`) is written to `sessionStorage` under `identity:<sessionId>` on first navigation and read back on subsequent renders, including page refresh. Refreshing the session page therefore works correctly without a server round-trip. `sessionStorage` is tab-scoped, so a second tab on the same session prompts a fresh join.

**Join-code collision protection**
`makeCode` regenerates until it finds a code not already in `sessionsByCode`, preventing silent overwrites. With a 6-character alphanumeric space of ~900 million combinations the loop practically never iterates more than once.

**Known limitation — `participantId` is unauthenticated**
There is no session token bound to a browser. Any client that knows a `sessionId` and `participantId` can submit mutations on behalf of that participant. A production fix would issue a short-lived signed token at join time and verify it on every mutation. This was deemed out of scope for the assignment.

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

### Step 2 — Configure environment variables

```bash
# frontend
cp frontend/.env.example frontend/.env
```

The defaults point to `localhost:4000` and work out of the box for local development. No backend `.env` is required unless you want to change the port.

### Step 3 — Start the backend

```bash
cd backend
npm run dev
```

The API server starts at **http://localhost:4000/graphql**.

### Step 4 — Start the frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

Both servers must be running at the same time for the app to work.

## Code formatting

Prettier is configured at the repo root. To format all files:

```bash
npm run format
```

To check formatting without writing:

```bash
npm run format:check
```

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
