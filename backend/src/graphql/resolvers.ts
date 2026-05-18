import { pubsub } from '../domain/sessionService';

export function buildResolvers(sessionService: any) {
  return {
    Query: {
      getSession: (_: any, { id }: { id: string }) => sessionService.getSession(id),
    },
    Mutation: {
      createSession: (_: any, { name }: { name: string }) => sessionService.createSession(name),
      joinSession: (_: any, { code, name }: { code: string; name: string }) =>
        sessionService.joinSession(code, name),
      submitEstimate: (_: any, args: any) =>
        sessionService.submitEstimate(args.sessionId, args.participantId, args.value),
      revealVotes: (_: any, { sessionId }: { sessionId: string }) =>
        sessionService.revealVotes(sessionId),
      resetEstimates: (_: any, { sessionId, participantId }: { sessionId: string; participantId: string }) =>
        sessionService.resetEstimates(sessionId, participantId),
      setStoryTitle: (_: any, { sessionId, participantId, title }: { sessionId: string; participantId: string; title: string }) =>
        sessionService.setStoryTitle(sessionId, participantId, title),
      closeSession: (_: any, { sessionId, participantId }: { sessionId: string; participantId: string }) =>
        sessionService.closeSession(sessionId, participantId),
    },
    Subscription: {
      sessionUpdated: {
        subscribe: (_: any, { sessionId }: { sessionId: string }) =>
          pubsub.asyncIterator(`SESSION_${sessionId}`),
      },
      sessionClosed: {
        subscribe: (_: any, { sessionId }: { sessionId: string }) =>
          pubsub.asyncIterator(`SESSION_${sessionId}`),
      },
    },
  };
}

export default buildResolvers;
