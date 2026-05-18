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

## Running locally

Start the backend:

```bash
cd backend
npm install
npm run dev