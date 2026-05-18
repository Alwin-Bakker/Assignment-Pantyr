import express from 'express';
import http from 'http';
import { ApolloServer, gql } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createSessionService } from './domain/sessionService';
import buildResolvers from './graphql/resolvers';

const typeDefs = gql`
  type Query {
    health: Health!
    getSession(id: ID!): Session
  }

  type Mutation {
    createSession(name: String!): JoinSessionResult!
    joinSession(code: String!, name: String!): JoinSessionResult!
    submitEstimate(sessionId: ID!, participantId: ID!, value: String!): Session!
    revealVotes(sessionId: ID!): Session!
    resetEstimates(sessionId: ID!, participantId: ID!): Session!
    setStoryTitle(sessionId: ID!, participantId: ID!, title: String!): Session!
    closeSession(sessionId: ID!, participantId: ID!): Boolean!
  }

  type Health {
    status: String!
    uptime: Float!
    timestamp: String!
  }

  type Participant {
    id: ID!
    name: String!
    joinedAt: String!
    isHost: Boolean!
  }

  type Estimate {
    participantId: ID!
    value: String
    hasVoted: Boolean!
  }

  type Session {
    id: ID!
    code: String!
    name: String!
    createdAt: String!
    participants: [Participant!]!
    estimates: [Estimate!]!
    revealed: Boolean!
    storyTitle: String
  }

  type JoinSessionResult {
    session: Session!
    participant: Participant!
  }

  type Subscription {
    sessionUpdated(sessionId: ID!): Session
    sessionClosed(sessionId: ID!): ID
  }
`;

async function start() {
  const service = createSessionService();
  const resolvers = buildResolvers(service);

  const mergedResolvers = {
    ...resolvers,
    Query: {
      ...(resolvers.Query || {}),
      health: () => ({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }),
    },
  };

  const schema = makeExecutableSchema({ typeDefs, resolvers: mergedResolvers as any });

  const app = express();
  const apolloServer = new ApolloServer({ schema });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  const httpServer = http.createServer(app);

  // Set up WebSocket server using graphql-ws
  const wsServer = new WebSocketServer({ server: httpServer, path: apolloServer.graphqlPath });
  // useServer will attach the GraphQL WebSocket server to the WebSocketServer instance
  const serverCleanup = useServer({ schema }, wsServer);

  const port = process.env.PORT || 4000;
  httpServer.listen(port, () => {
    console.log(`Server ready at http://localhost:${port}${apolloServer.graphqlPath}`);
  });

  const shutdown = async () => {
    console.log('Shutting down server...');
    try {
      // dispose the WebSocket server integration
      serverCleanup.dispose();
    } catch (err) {
      console.error('Error disposing websocket server:', err);
    }
    try {
      await apolloServer.stop();
    } catch (err) {
      console.error('Error stopping Apollo Server:', err);
    }
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
