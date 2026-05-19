import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export type SessionIdentity = {
  sessionId: string;
  participantId: string;
  isHost: boolean;
};

type LocationState = { sessionId?: string; participantId?: string; isHost?: boolean } | null;

export function useSessionIdentity(): SessionIdentity | null {
  const { id: sessionId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState;

  const identity = useMemo<SessionIdentity | null>(() => {
    if (!sessionId) return null;

    // Prefer router state (fresh navigation)
    if (state?.participantId != null) {
      return {
        sessionId,
        participantId: state.participantId,
        isHost: state.isHost ?? false,
      };
    }

    // Fallback: sessionStorage (page refresh)
    try {
      const stored = sessionStorage.getItem(`identity:${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as { participantId: string; isHost: boolean };
        return { sessionId, participantId: parsed.participantId, isHost: parsed.isHost };
      }
    } catch {
      // corrupt storage entry
    }

    return null;
  }, [sessionId, state]);

  // Keep sessionStorage in sync whenever we have fresh state
  useEffect(() => {
    if (identity && state?.participantId != null) {
      sessionStorage.setItem(
        `identity:${identity.sessionId}`,
        JSON.stringify({ participantId: identity.participantId, isHost: identity.isHost }),
      );
    }
  }, [identity, state?.participantId]);

  // Redirect if no identity can be resolved
  useEffect(() => {
    if (sessionId && identity === null) {
      navigate('/', { replace: true });
    }
  }, [sessionId, identity, navigate]);

  return identity;
}
