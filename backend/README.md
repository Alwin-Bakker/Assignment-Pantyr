# Backend - GraphQL Health service

Install deps and run:

```bash
cd backend
npm install
npm run dev
```

Query (GraphQL):

```graphql
query {
  health {
    status
    uptime
    timestamp
  }
}
```

Mutation example - create a session and join as a participant:

```graphql
mutation {
  createSession(name: "Alice") {
    session {
      id
      name
      createdAt
      participants { id name joinedAt }
    }
    participant { id name joinedAt }
  }
}
```

Join an existing session:

```graphql
mutation {
  joinSession(sessionId: "s_abc123", name: "Bob") {
    session { id name participants { id name } }
    participant { id name joinedAt }
  }
}
```

Submit an estimate for a participant:

```graphql
mutation {
  submitEstimate(sessionId: "s_abc123", participantId: "p_def456", value: "5") {
    id
    participants { id name estimate }
  }
}
```

Reveal votes for a session:

```graphql
mutation {
  revealVotes(sessionId: "s_abc123") {
    id
    participants { id name estimate }
  }
}
```
