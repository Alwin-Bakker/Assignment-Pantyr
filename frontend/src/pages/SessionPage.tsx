import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useSubscription, gql } from '@apollo/client';
import { SUBMIT_ESTIMATE, RESET_ESTIMATES, REVEAL_VOTES, GET_SESSION, SET_STORY_TITLE } from '../graphql/operations';
import { CLOSE_SESSION } from '../graphql/operations';
import Button from '../components/Button';
import Input from '../components/Input';
import { toast } from 'sonner';
import { Clipboard, QrCode, XCircle, Trash2, Eye, Edit } from 'lucide-react';
import AlertDialog from '../components/ui/AlertDialog';

const BUTTONS = ['0','1/2','1','2','3','5','8','13','20','40','100','?','∞','☕'];

export default function SessionPage() {
  const { code } = useParams();
  const location = useLocation();
  const sessionId = (location.state as any)?.sessionId;
  const participantId = (location.state as any)?.participantId;
  const isHost = Boolean((location.state as any)?.isHost);

  const [submitEstimate] = useMutation(SUBMIT_ESTIMATE);
  const [resetEstimates] = useMutation(RESET_ESTIMATES);
  const [revealVotes] = useMutation(REVEAL_VOTES);
  const [closeSession] = useMutation(CLOSE_SESSION);
  const [setStoryTitle] = useMutation(SET_STORY_TITLE);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [titleDraft, setTitleDraft] = useState('');

  const { data: sessionData, refetch } = useQuery(GET_SESSION, { variables: { id: sessionId }, skip: !sessionId });

  const currentSession = sessionData?.getSession;
  const currentParticipantName = currentSession?.participants?.find((p: any) => p.id === participantId)?.name;
  const myEstFromResponse = lastResponse?.estimates?.find((x: any) => x.participantId === participantId)?.value;
  const myEstFromSession = currentSession?.estimates?.find((e: any) => e.participantId === participantId)?.value;
  const selectedValue = (myEstFromResponse ?? myEstFromSession) != null ? String(myEstFromResponse ?? myEstFromSession) : null;
  const [showQR, setShowQR] = useState(false);
  const prevSessionRef = useRef<any>(null);

  useEffect(() => {
    if (currentSession) prevSessionRef.current = currentSession;
  }, [currentSession]);

  useSubscription(
    // @ts-ignore
    gql`
      subscription OnSessionUpdated($sessionId: ID!) {
        sessionUpdated(sessionId: $sessionId) {
          id
          code
          participants { id name }
          estimates { participantId value hasVoted }
          revealed
          storyTitle
        }
      }
    `,
    {
      skip: !sessionId,
      variables: { sessionId },
      onSubscriptionData: ({ subscriptionData }) => {
        const sess = subscriptionData.data?.sessionUpdated;
        if (sess) {
          // detect a reset: previously some votes present, now all hasVoted are false
          const prev = prevSessionRef.current;
          const nowAllNotVoted = sess.estimates && sess.estimates.length > 0 && sess.estimates.every((e: any) => !e.hasVoted);
          const prevSomeVoted = prev && prev.estimates && prev.estimates.some((e: any) => e.hasVoted);
          if (nowAllNotVoted && prevSomeVoted) {
            toast('Round has been reset');
          }
          if (refetch) refetch();
          prevSessionRef.current = sess;
        }
      },
    }
  );

  // also subscribe for sessionClosed to redirect
  useSubscription(
    gql`
      subscription OnSessionClosed($sessionId: ID!) {
        sessionClosed(sessionId: $sessionId) {
          id
        }
      }
    `,
    {
      skip: !sessionId,
      variables: { sessionId },
      onSubscriptionData: ({ subscriptionData }) => {
        if (subscriptionData.data?.sessionClosed) {
          toast('Session was closed by host');
          window.location.href = '/';
        }
      },
    }
  );

  const handleEstimate = async (value: string) => {
    if (!sessionId || !participantId) return;
    try {
      const res = await submitEstimate({ variables: { sessionId, participantId, value } });
      setLastResponse(res.data?.submitEstimate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    if (!sessionId || !participantId) return;
    try {
      const res = await resetEstimates({ variables: { sessionId, participantId } });
      setLastResponse(res.data?.resetEstimates);
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    }
  };
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleReveal = async () => {
    if (!sessionId) return;
    const estimates = currentSession?.estimates || [];
    const allVoted = estimates.length > 0 && estimates.every((e: any) => e.hasVoted);
    if (!allVoted) {
      setShowRevealConfirm(true);
      return;
    }
    try {
      const res = await revealVotes({ variables: { sessionId } });
      setLastResponse(res.data?.revealVotes);
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const invite = `${window.location.origin}/?code=${code}`;

  // compute numeric average when revealed
  function parseEstimateValue(v: any) {
    if (v == null) return null;
    const s = String(v).trim();
    if (s.includes('/')) {
      const parts = s.split('/').map((p) => p.trim());
      const a = parseFloat(parts[0]);
      const b = parseFloat(parts[1]);
      if (!isNaN(a) && !isNaN(b) && b !== 0) return a / b;
    }
    const n = parseFloat(s.replace(/[^0-9.\-]+/g, ''));
    if (!isNaN(n)) return n;
    return null;
  }

  const numericVals = (currentSession?.estimates || [])
    .map((e: any) => parseEstimateValue(e.value))
    .filter((x: any) => x != null);
  const average = numericVals.length ? numericVals.reduce((a: number, b: number) => a + b, 0) / numericVals.length : null;
  const totalParticipants = (currentSession?.participants || []).length;
  const votesCount = (currentSession?.estimates || []).filter((e: any) => e.hasVoted).length;
  // story context: saved vs draft. saved is persisted; draft is edited until Save pressed.
  const [storyContextSaved, setStoryContextSaved] = useState(() => {
    try {
      return sessionId ? localStorage.getItem(`storyContext:${sessionId}`) || '' : '';
    } catch {
      return '';
    }
  });
  const [storyContextDraft, setStoryContextDraft] = useState('');

  useEffect(() => {
    setStoryContextDraft(storyContextSaved || '');
  }, [storyContextSaved, sessionId]);

  return (
    <main className="min-h-screen p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-md border shadow-sm h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Session {code}</h2>
                  {currentSession?.storyTitle && (
                    <p className="text-sm text-slate-700">Story: <strong>{currentSession.storyTitle}</strong></p>
                  )}
                </div>
                <div className="text-sm text-slate-600">{currentParticipantName ? <span>You are: <strong>{currentParticipantName}</strong></span> : (participantId && <span className="text-xs">You are: <strong className="font-mono">{participantId}</strong></span>)}</div>
              </div>

              <div className="mt-6">
                {/* Current story panel */}
                <div className="mb-4 rounded-lg border bg-slate-50 p-4">
                  <h3 className="text-lg font-medium">Current story</h3>
                  {currentSession?.storyTitle ? (
                    <p className="mt-2 text-slate-800 text-base">{currentSession.storyTitle}</p>
                  ) : (
                    <div className="mt-2 text-sm text-slate-600">No story selected yet. The host can add a story title from the admin panel.</div>
                  )}
                  <div className="mt-3">
                    <h4 className="text-sm font-medium">Context</h4>
                    <div className="mt-2 text-sm text-slate-600">{storyContextSaved ? storyContextSaved : 'No story context added.'}</div>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    {votesCount > 0 ? (
                      <span>{votesCount} of {totalParticipants} participants voted</span>
                    ) : (
                      <span>Waiting for estimates</span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-medium">Participants</h3>
                <ul className="mt-2 space-y-2">
                  {(currentSession?.participants || []).map((p: any) => {
                    const est = (currentSession?.estimates || []).find((e: any) => e.participantId === p.id) || { hasVoted: false, value: null };
                    const isMe = participantId === p.id;
                    const voted = Boolean(est?.hasVoted);
                    return (
                      <li key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{p.name}</span>
                          {isMe && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">You</span>}
                        </div>
                        <div>
                          {voted ? (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Voted</span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Waiting</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 flex gap-2">
                  <Button onClick={async () => {
                    try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(invite);
                            toast.success('Invite link copied to clipboard');
                          } else {
                            try {
                              window.prompt('Copy this invite link', invite);
                              toast('Invite link (copy from prompt)');
                            } catch (e) {
                              toast.error('Failed to provide invite link');
                            }
                          }
                    } catch (e) { console.error('Failed to copy invite link', e); }
                  }}>
                    <Clipboard size={16} /> Copy invite
                  </Button>
                  <Button onClick={() => setShowQR(true)}>
                    <QrCode size={16} /> QR
                  </Button>
                </div>

                {/* Story context display under title */}
                {storyContextSaved && (
                  <div className="mt-4 p-3 rounded bg-slate-50 text-sm text-slate-700">{storyContextSaved}</div>
                )}

                <div className="mt-6">
                  <h3 className="text-lg font-medium">Selected estimate</h3>
                  {selectedValue ? (
                    <p className="mt-2 text-sm text-slate-600">Your estimate: <span className="font-semibold text-slate-950">{selectedValue}</span></p>
                  ) : (
                    <div className="mt-2 text-sm text-slate-600">Choose a card for this story.</div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3" role="list">
                    {BUTTONS.map((b) => {
                      const isSelected = selectedValue === String(b);
                      return (
                        <Button
                          key={b}
                          variant={isSelected ? 'primary' : 'outline'}
                          onClick={() => handleEstimate(b)}
                          disabled={currentSession?.revealed}
                          aria-label={b === '☕' ? 'Coffee break estimate' : `Estimate ${b}`}
                        >
                          {b}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium">Voting status</h3>
                  <div className="mt-2 text-sm text-slate-600">{votesCount} of {totalParticipants} participants voted.</div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium">Results</h3>
                    <section data-testid="results-panel">
                    {currentSession?.revealed ? (
                      (() => {
                        // build mapping from value -> names
                        const buckets: Record<string, string[]> = {};
                        (currentSession?.participants || []).forEach((p: any) => {
                          const e = (currentSession?.estimates || []).find((est: any) => est.participantId === p.id && est.value != null);
                          if (e) {
                            const val = String(e.value);
                            buckets[val] = buckets[val] || [];
                            buckets[val].push(p.name);
                          }
                        });

                        // create ordered list of unique values according to BUTTONS
                        const uniqueValues = Object.keys(buckets).sort((a, b) => {
                          const ia = BUTTONS.indexOf(a);
                          const ib = BUTTONS.indexOf(b);
                          return (ia === -1 ? BUTTONS.length : ia) - (ib === -1 ? BUTTONS.length : ib);
                        });

                        return (
                          <div className="mt-2 space-y-2">
                            {uniqueValues.map((val) => (
                              <div key={val} className="flex items-start gap-4">
                                <div className="w-12 font-semibold text-slate-800">{val}</div>
                                <div className="flex gap-2 flex-wrap text-sm text-slate-600">{buckets[val].map((n) => (<span key={n}>{n}</span>))}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="mt-2 text-sm text-slate-600">Hidden until estimates are revealed.</div>
                    )}
                  </section>
                </div>
            </div>
            </div>
          </div>
          <aside className="space-y-6 h-full">
            <div className="bg-white p-6 rounded-md border shadow-sm h-full">
              <h3 className="text-lg font-medium">Admin</h3>
              <div className="mt-4 flex flex-col gap-3">
                {isHost && (
                  <>
                    <Input id="story-title" label="Story title" placeholder="Add a short title" value={titleDraft} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitleDraft(e.target.value)} />
                    <div className="mt-2">
                      <Button className="w-full" onClick={async () => {
                        if (!sessionId || !participantId) return;
                        try {
                          const res = await setStoryTitle({ variables: { sessionId, participantId, title: titleDraft } });
                          if (res?.data?.setStoryTitle?.storyTitle) {
                            setTitleDraft('');
                            if (refetch) refetch();
                          }
                        } catch (e) { console.error(e); }
                      }} disabled={!titleDraft.trim()} variant="primary"><Edit size={16} /> Set story title</Button>
                    </div>
                    <div className="mt-2">
                      <Input id="story-context" label="Story context" placeholder="Add details about the story" multiline rows={4} value={storyContextDraft} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStoryContextDraft(e.target.value)} />
                      <div className="mt-2">
                        <Button className="w-full" onClick={() => {
                          try {
                            if (sessionId) localStorage.setItem(`storyContext:${sessionId}`, storyContextDraft || '');
                            setStoryContextSaved(storyContextDraft || '');
                            toast.success('Story context saved');
                          } catch {
                            toast.error('Failed to save context');
                          }
                        }} variant="secondary">Save context</Button>
                      </div>
                    </div>
                    <div>
                      <Button className="w-full" onClick={handleReveal} disabled={votesCount === 0} variant="secondary"><Eye size={16} /> Reveal estimates</Button>
                    </div>
                    <div>
                      <Button className="w-full !border-[#fd4c4c] hover:!bg-red-50 !text-[#fd4c4c]" onClick={handleReset} disabled={votesCount === 0} variant="outline"><Trash2 size={16} /> Reset round</Button>
                    </div>
                    <div>
                      <Button
                        className="w-full !border-[#fd4c4c] !text-[#fd4c4c]"
                        onClick={async () => {
                          if (!sessionId || !participantId) return;
                          setShowCloseConfirm(true);
                        }}
                        variant="ghost"
                      >
                        <XCircle size={16} /> Close session
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
          {showQR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white p-6 rounded-md shadow-lg w-[320px] relative">
                <button onClick={() => setShowQR(false)} className="absolute top-3 right-3 text-slate-600"><XCircle /></button>
                <h3 className="text-lg font-medium mb-3">Invite QR</h3>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invite)}`} alt="Invite QR code" className="mx-auto" />
                <div className="mt-4 flex justify-center">
                  <Button onClick={async () => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              await navigator.clipboard.writeText(invite);
                              toast.success('Invite link copied to clipboard');
                            }
                          } catch (e) { console.error(e); toast.error('Failed to copy invite link'); }
                  }}><Clipboard size={16} /> Copy link</Button>
                </div>
              </div>
            </div>
          )}
          <AlertDialog
            open={showRevealConfirm}
            onOpenChange={setShowRevealConfirm}
            title="Reveal estimates?"
            description="Not everyone has voted yet. Reveal anyway?"
            confirmLabel="Reveal"
            cancelLabel="Cancel"
            onConfirm={async () => {
              try {
                const res = await revealVotes({ variables: { sessionId } });
                setLastResponse(res.data?.revealVotes);
                if (refetch) refetch();
              } catch (e) {
                console.error(e);
              }
            }}
          />
          <AlertDialog
            open={showCloseConfirm}
            onOpenChange={setShowCloseConfirm}
            title="Close session?"
            description="This will remove the session for all participants."
            confirmLabel="Close session"
            cancelLabel="Cancel"
            onConfirm={async () => {
              try {
                if (!sessionId || !participantId) return;
                await closeSession({ variables: { sessionId, participantId } });
                window.location.href = '/';
              } catch (e) {
                console.error(e);
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
