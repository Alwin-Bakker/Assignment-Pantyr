import { PubSub } from 'graphql-subscriptions';
import type { SessionService } from '../domain/sessionTypes';

export function buildResolvers(sessionService: SessionService, pubsub: PubSub) {
  return {
    Query: {
      getSession: (_: unknown, { id }: { id: string }) => sessionService.getSession(id),
      getSessionByCode: (_: unknown, { code }: { code: string }) => sessionService.getSessionByCode(code),
    },
    Mutation: {
      createSession: (_: unknown, { name }: { name: string }) =>
        sessionService.createSession(name),
      joinSession: (_: unknown, { code, name }: { code: string; name: string }) =>
        sessionService.joinSession(code, name),
      submitEstimate: (
        _: unknown,
        { sessionId, participantId, value }: { sessionId: string; participantId: string; value: string },
      ) => sessionService.submitEstimate(sessionId, participantId, value),
      revealVotes: (
        _: unknown,
        { sessionId, participantId }: { sessionId: string; participantId: string },
      ) => sessionService.revealVotes(sessionId, participantId),
      resetEstimates: (
        _: unknown,
        { sessionId, participantId }: { sessionId: string; participantId: string },
      ) => sessionService.resetEstimates(sessionId, participantId),
      setStoryTitle: (
        _: unknown,
        { sessionId, participantId, title }: { sessionId: string; participantId: string; title: string },
      ) => sessionService.setStoryTitle(sessionId, participantId, title),
      setStoryContext: (
        _: unknown,
        { sessionId, participantId, context }: { sessionId: string; participantId: string; context: string },
      ) => sessionService.setStoryContext(sessionId, participantId, context),
      closeSession: (
        _: unknown,
        { sessionId, participantId }: { sessionId: string; participantId: string },
      ) => sessionService.closeSession(sessionId, participantId),
      leaveSession: (
        _: unknown,
        { sessionId, participantId }: { sessionId: string; participantId: string },
      ) => { sessionService.removeParticipant(sessionId, participantId); return true; },
    },
    Subscription: {
      sessionUpdated: {
        subscribe: (_: unknown, { sessionId }: { sessionId: string }) =>
          pubsub.asyncIterator(`SESSION_${sessionId}_UPDATED`),
      },
      sessionClosed: {
        subscribe: (_: unknown, { sessionId }: { sessionId: string }) =>
          pubsub.asyncIterator(`SESSION_${sessionId}_CLOSED`),
      },
    },
  };
}

export default buildResolvers;

