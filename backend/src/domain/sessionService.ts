import { Participant, Session, JoinSessionResult, Estimate } from './sessionTypes';
import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

function makeId(prefix = '') {
  // Produce more human-friendly identifiers.
  // - Join codes (prefix === 'C') are 6-char uppercase, excluding ambiguous chars.
  // - Session ids (prefix startsWith 's_') become `s-<time>-<rand>`.
  // - Participant ids (prefix startsWith 'p_') become `u-<time>-<rand>`.
  const now = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();

  if (prefix === 'C') {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // avoid I, O, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  if (prefix && prefix.startsWith('s_')) {
    return `s-${now}-${rand}`;
  }

  if (prefix && prefix.startsWith('p_')) {
    return `u-${now}-${rand}`;
  }

  return prefix + now + rand;
}

export function createSessionService() {
  const sessionsById = new Map<string, Session>();
  const sessionsByCode = new Map<string, Session>();

  function toSessionView(s: Session): Session {
    // When not revealed, hide values (value=null) but keep hasVoted flags
    const estimates = s.estimates.map((e) => ({
      participantId: e.participantId,
      hasVoted: e.hasVoted,
      // if revealed show storedValue, otherwise hide
      value: s.revealed ? e.storedValue ?? null : null,
    }));

    return { ...s, estimates } as Session;
  }

  function createSession(name: string): JoinSessionResult {
    const sessionId = makeId('s_');
    const code = makeId('C');
    const participantId = makeId('p_');
    const now = new Date().toISOString();
    const participant: Participant = { id: participantId, name, joinedAt: now, isHost: true };
    const estimates: Estimate[] = [{ participantId, value: null, hasVoted: false, storedValue: null }];
    const session: Session = { id: sessionId, code, name: `${name}'s session`, createdAt: now, participants: [participant], estimates, revealed: false, storyTitle: null };
    sessionsById.set(sessionId, session);
    sessionsByCode.set(code, session);
    pubsub.publish(`SESSION_${session.id}`, { sessionUpdated: toSessionView(session) });
    return { session: toSessionView(session), participant };
  }

  function joinSession(code: string, name: string): JoinSessionResult {
    const session = sessionsByCode.get(code);
    if (!session) throw new Error(`Session with code ${code} not found`);
    const participantId = makeId('p_');
    const now = new Date().toISOString();
    const participant: Participant = { id: participantId, name, joinedAt: now, isHost: false };
    session.participants.push(participant);
    session.estimates.push({ participantId, value: null, hasVoted: false, storedValue: null });
    sessionsById.set(session.id, session);
    pubsub.publish(`SESSION_${session.id}`, { sessionUpdated: toSessionView(session) });
    return { session: toSessionView(session), participant };
  }

  function submitEstimate(sessionId: string, participantId: string, value: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    if (session.revealed) throw new Error('Cannot vote after votes have been revealed');
    const estimate = session.estimates.find((e) => e.participantId === participantId);
    if (!estimate) throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    estimate.storedValue = value;
    estimate.hasVoted = true;

    // hide all public values until reveal
    session.estimates.forEach((e) => {
      e.value = null;
    });

    // if everyone has voted, auto-reveal
    const allVoted = session.estimates.every((e) => e.hasVoted === true);
    if (allVoted) {
      session.revealed = true;
      session.estimates.forEach((e) => {
        e.value = e.storedValue ?? null;
      });
    }

    sessionsById.set(session.id, session);
    // publish update for other participants
    pubsub.publish(`SESSION_${session.id}`, { sessionUpdated: toSessionView(session) });

    return toSessionView(session);
  }

  function setStoryTitle(sessionId: string, participantId: string, title: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker) throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can set the story title');
    session.storyTitle = title;
    sessionsById.set(session.id, session);
    pubsub.publish(`SESSION_${session.id}`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function revealVotes(sessionId: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    session.revealed = true;
    session.estimates.forEach((e) => {
      e.value = e.storedValue ?? null;
    });
    sessionsById.set(session.id, session);
    pubsub.publish(`SESSION_${session.id}`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function getSession(sessionId: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    return toSessionView(session);
  }

  function resetEstimates(sessionId: string, participantId: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker) throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can reset estimates');
    session.estimates.forEach((e) => {
      e.storedValue = null;
      e.value = null;
      e.hasVoted = false;
    });
    session.revealed = false;
    sessionsById.set(session.id, session);
    // publish update so all participants receive the reset event
    pubsub.publish(`SESSION_${session.id}`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function closeSession(sessionId: string, participantId: string) {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker) throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can close the session');
    sessionsById.delete(sessionId);
    sessionsByCode.delete(session.code);
    pubsub.publish(`SESSION_${session.id}`, { sessionClosed: session.id });
    return true;
  }

  return {
    createSession,
    joinSession,
    submitEstimate,
    revealVotes,
    resetEstimates,
    getSession,
    setStoryTitle,
    closeSession,
  };
}
