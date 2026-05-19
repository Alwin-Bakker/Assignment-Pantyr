import React, { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { SUBMIT_ESTIMATE, RECONNECT_PARTICIPANT } from '../graphql/operations';
import { useSessionIdentity } from '../hooks/useSessionIdentity';
import { useSessionData } from '../hooks/useSessionData';
import ParticipantList from '../components/session/ParticipantList';
import CardGrid from '../components/session/CardGrid';
import ResultsPanel from '../components/session/ResultsPanel';
import AdminPanel from '../components/session/AdminPanel';
import InvitePanel from '../components/session/InvitePanel';

export default function SessionPage() {
  const identity = useSessionIdentity();

  const sessionId = identity?.sessionId ?? '';
  const participantId = identity?.participantId ?? '';
  const isHost = identity?.isHost ?? false;

  const { session, refetch } = useSessionData(sessionId);
  const [submitEstimate] = useMutation(SUBMIT_ESTIMATE);
  const [reconnectParticipantMutation] = useMutation(RECONNECT_PARTICIPANT);

  // Re-mark this participant as connected whenever the page (re)loads.
  // The beforeunload handler sends a leaveSession keepalive fetch on every
  // unload (including reloads), so we cancel that out here on mount.
  useEffect(() => {
    if (!sessionId || !participantId) return;
    reconnectParticipantMutation({ variables: { sessionId, participantId } }).catch(() => {
      // Session may have been closed while offline — ignore.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local state gives instant card-highlight feedback before the server round-trip.
  // Cleared when the backend confirms the round was reset (hasVoted → false).
  const [localSelected, setLocalSelected] = useState<string | null>(null);

  const myHasVoted = session?.estimates.find((e) => e.participantId === participantId)?.hasVoted ?? false;
  useEffect(() => {
    if (!myHasVoted) setLocalSelected(null);
  }, [myHasVoted]);

  // keepalive fetch fires even while the page is unloading (tab/browser close).
  // We intentionally do NOT call leaveSession in the cleanup because React
  // StrictMode double-invokes effects in dev, which would immediately mark the
  // participant as disconnected.
  useEffect(() => {
    if (!sessionId || !participantId) return;
    const url = import.meta.env.VITE_GRAPHQL_HTTP_URL as string;
    const handleBeforeUnload = () => {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation LeaveSession($s: ID!, $p: ID!) { leaveSession(sessionId: $s, participantId: $p) }`,
          variables: { s: sessionId, p: participantId },
        }),
        keepalive: true,
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, participantId]);

  const handleEstimate = async (value: string) => {
    if (!sessionId || !participantId) return;
    setLocalSelected(value);
    try {
      await submitEstimate({ variables: { sessionId, participantId, value } });
    } catch (e) {
      console.error(e);
      setLocalSelected(null);
    }
  };

  if (!identity || !session) return null;

  const myEstimate = session.estimates.find((e) => e.participantId === participantId);
  const serverValue = myEstimate?.value != null ? String(myEstimate.value) : null;
  const selectedValue = serverValue ?? localSelected;
  const currentParticipantName = session.participants.find((p) => p.id === participantId)?.name;
  const votesCount = session.estimates.filter((e) => e.hasVoted).length;
  const totalParticipants = session.participants.length;

  return (
    <main className="min-h-screen p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top row: story content (left) + participants / invite (right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── Left: story-related content ─────────────────────────── */}
          <div className="md:col-span-2 flex flex-col">
            <div className="bg-white p-6 rounded-md border border-p-green shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-p-dark">Session {session.code}</h2>
                {currentParticipantName && (
                  <div className="text-sm text-p-grey">
                    You are: <strong className="text-p-dark">{currentParticipantName}</strong>
                  </div>
                )}
              </div>

              {/* Current story */}
              <div className="mb-4 rounded-lg border border-p-green bg-p-light p-4">
                <h3 className="text-lg font-semibold text-p-dark">
                  Current story{session.storyTitle ? (
                    <span className="font-normal text-p-dark">: {session.storyTitle}</span>
                  ) : (
                    <span className="text-sm font-normal text-p-grey"> — no story set yet</span>
                  )}
                </h3>
                {session.storyContext && (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold text-p-dark">Context</h4>
                    <div className="mt-2 text-sm text-p-grey">{session.storyContext}</div>
                  </div>
                )}
                <div className="mt-4 text-sm text-p-grey">
                  {votesCount > 0 ? (
                    <span>{votesCount} of {totalParticipants} participants voted</span>
                  ) : (
                    <span>Waiting for estimates</span>
                  )}
                </div>
              </div>

              {/* Estimate cards */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-p-dark">Selected estimate</h3>
                {selectedValue ? (
                  <p className="mt-2 text-sm text-p-grey">
                    Your estimate:{' '}
                    <span className="font-semibold text-p-navy">{selectedValue}</span>
                  </p>
                ) : (
                  <div className="mt-2 text-sm text-p-grey">Choose a card for this story.</div>
                )}
                <CardGrid
                  selectedValue={selectedValue}
                  revealed={session.revealed}
                  onEstimate={handleEstimate}
                />
              </div>

              {/* Results */}
              <div>
                <h3 className="text-lg font-semibold text-p-dark">Results</h3>
                <ResultsPanel session={session} />
              </div>
            </div>
          </div>

          {/* ── Right: participants + invite ─────────────────────────── */}
          <aside className="flex flex-col">
            <div className="bg-white p-6 rounded-md border border-p-green shadow-sm flex-1">
              <h3 className="text-lg font-semibold text-p-dark mb-4">Participants</h3>
              <ParticipantList
                participants={session.participants}
                estimates={session.estimates}
                participantId={participantId}
              />
              <div className="mt-6">
                <InvitePanel code={session.code} sessionId={sessionId} />
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom row: admin (host only) – same width as story col */}
        {isHost && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-md border border-p-green shadow-sm">
              <h3 className="text-lg font-semibold text-p-dark mb-4">Admin</h3>
              <AdminPanel
                sessionId={sessionId}
                participantId={participantId}
                session={session}
                onRefetch={refetch}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
