import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useSubscription } from '@apollo/client';
import { toast } from 'sonner';
import { GET_SESSION, ON_SESSION_UPDATED, ON_SESSION_CLOSED } from '../graphql/operations';

export type SessionData = {
  id: string;
  code: string;
  storyTitle?: string | null;
  storyContext?: string | null;
  revealed: boolean;
  participants: { id: string; name: string; connected: boolean }[];
  estimates: { participantId: string; value: string | null; hasVoted: boolean }[];
  completedStories: { title: string; points: string }[];
};

type UseSessionDataResult = {
  session: SessionData | null;
  loading: boolean;
  refetch: () => void;
};

export function useSessionData(sessionId: string): UseSessionDataResult {
  const navigate = useNavigate();
  const prevHasVotesRef = useRef<boolean>(false);
  const prevStoryTitleRef = useRef<string | null | undefined>(undefined);

  const { data, loading, refetch } = useQuery(GET_SESSION, {
    variables: { id: sessionId },
    skip: !sessionId,
  });

  const session: SessionData | null = data?.getSession ?? null;

  // Seed the ref from the initial query result so the first subscription event
  // can correctly detect a change vs. the already-loaded title.
  if (prevStoryTitleRef.current === undefined && session !== null) {
    prevStoryTitleRef.current = session.storyTitle;
  }

  useSubscription(ON_SESSION_UPDATED, {
    skip: !sessionId,
    variables: { sessionId },
    onSubscriptionData: ({ subscriptionData }) => {
      const updated = subscriptionData.data?.sessionUpdated as SessionData | undefined;
      if (!updated) return;

      const nowAllNotVoted =
        updated.estimates.length > 0 && updated.estimates.every((e) => !e.hasVoted);
      // Suppress the reset toast when pickStoryPoints fired — that clears
      // the title and resets at the same time, so the AdminPanel already
      // shows a "Saved" toast and the reset toast would overlap.
      const storyWasPicked = !!prevStoryTitleRef.current && !updated.storyTitle;
      if (nowAllNotVoted && prevHasVotesRef.current && !storyWasPicked) {
        toast('Round has been reset');
      }

      // Toast when the story title is set or changed (undefined = first load, skip)
      if (
        prevStoryTitleRef.current !== undefined &&
        updated.storyTitle !== prevStoryTitleRef.current &&
        updated.storyTitle
      ) {
        toast(`Story updated: ${updated.storyTitle}`);
      }

      prevHasVotesRef.current = updated.estimates.some((e) => e.hasVoted);
      prevStoryTitleRef.current = updated.storyTitle;

      refetch();
    },
  });

  useSubscription(ON_SESSION_CLOSED, {
    skip: !sessionId,
    variables: { sessionId },
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.sessionClosed) {
        toast('Session was closed by host');
        navigate('/', { replace: true });
      }
    },
  });

  return { session, loading, refetch };
}
