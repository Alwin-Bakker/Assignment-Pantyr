import { Participant, Session, JoinSessionResult, Estimate, SessionService } from './sessionTypes';
import { PubSub } from 'graphql-subscriptions';
import { readDb, writeDb } from '../db';

export const VALID_CARD_VALUES = new Set([
  '0',
  '1/2',
  '1',
  '2',
  '3',
  '5',
  '8',
  '13',
  '20',
  '40',
  '100',
  '?',
  '∞',
  '☕',
]);

function makeCode(existing: Map<string, Session>): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // avoid I, O, 0, 1
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (existing.has(code));
  return code;
}

function makeId(prefix: 's' | 'u'): string {
  const now = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${now}-${rand}`;
}

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function createSessionService(pubsub: PubSub, ttlMs = SESSION_TTL_MS): SessionService {
  const sessionsById = new Map<string, Session>();
  const sessionsByCode = new Map<string, Session>();

  const stored = readDb();
  Object.values(stored.sessions).forEach((session) => {
    // Migrate sessions that predate the completedStories field
    session.completedStories ??= [];
    sessionsById.set(session.id, session);
    sessionsByCode.set(session.code, session);
  });

  function persist() {
    const data = readDb();
    data.sessions = {};
    sessionsById.forEach((session, id) => {
      data.sessions[id] = session;
    });
    writeDb();
  }

  function touch(session: Session): void {
    session.lastActivityAt = new Date().toISOString();
  }

  function toSessionView(s: Session): Session {
    const estimates = s.estimates.map((e) => ({
      participantId: e.participantId,
      hasVoted: e.hasVoted,
      value: s.revealed ? (e.storedValue ?? null) : null,
    }));
    return { ...s, estimates } as Session;
  }

  function pruneExpired(): void {
    const now = Date.now();
    sessionsById.forEach((session, id) => {
      const lastActivity = session.lastActivityAt ?? session.createdAt;
      if (now - Date.parse(lastActivity) > ttlMs) {
        sessionsById.delete(id);
        sessionsByCode.delete(session.code);
      }
    });
    persist();
  }

  pruneExpired();
  setInterval(pruneExpired, 60 * 60 * 1000);

  function createSession(name: string): JoinSessionResult {
    const sessionId = makeId('s');
    const code = makeCode(sessionsByCode);
    const participantId = makeId('u');
    const now = new Date().toISOString();
    const participant: Participant = {
      id: participantId,
      name,
      joinedAt: now,
      isHost: true,
      connected: true,
    };
    const estimates: Estimate[] = [
      { participantId, value: null, hasVoted: false, storedValue: null },
    ];
    const session: Session = {
      id: sessionId,
      code,
      name: `${name}'s session`,
      createdAt: now,
      lastActivityAt: now,
      participants: [participant],
      estimates,
      revealed: false,
      storyTitle: null,
      storyContext: null,
      completedStories: [],
    };
    sessionsById.set(sessionId, session);
    sessionsByCode.set(code, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return { session: toSessionView(session), participant };
  }

  function joinSession(code: string, name: string): JoinSessionResult {
    const session = sessionsByCode.get(code);
    if (!session) throw new Error(`Session with code ${code} not found`);
    const participantId = makeId('u');
    const now = new Date().toISOString();
    const participant: Participant = {
      id: participantId,
      name,
      joinedAt: now,
      isHost: false,
      connected: true,
    };
    session.participants.push(participant);
    session.estimates.push({ participantId, value: null, hasVoted: false, storedValue: null });
    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return { session: toSessionView(session), participant };
  }

  function submitEstimate(sessionId: string, participantId: string, value: string): Session {
    if (!VALID_CARD_VALUES.has(value)) {
      throw new Error(
        `Invalid estimate value "${value}". Must be one of: ${[...VALID_CARD_VALUES].join(', ')}`,
      );
    }
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    if (session.revealed) throw new Error('Cannot vote after votes have been revealed');
    const estimate = session.estimates.find((e) => e.participantId === participantId);
    if (!estimate)
      throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    estimate.storedValue = value;
    estimate.hasVoted = true;
    session.estimates.forEach((e) => {
      e.value = null;
    });

    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function setStoryTitle(sessionId: string, participantId: string, title: string): Session {
    const trimmed = title.trim();
    if (!trimmed) throw new Error('Story title cannot be empty');
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker)
      throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can set the story title');
    session.storyTitle = trimmed;
    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function revealVotes(sessionId: string, participantId: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker)
      throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can reveal votes');
    session.revealed = true;
    session.estimates.forEach((e) => {
      e.value = e.storedValue ?? null;
    });
    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function getSession(sessionId: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    return toSessionView(session);
  }

  function getSessionByCode(code: string): Session {
    const session = sessionsByCode.get(code);
    if (!session) throw new Error(`Session with code ${code} not found`);
    return toSessionView(session);
  }

  function setStoryContext(sessionId: string, participantId: string, context: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker)
      throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can set the story context');
    session.storyContext = context.trim();
    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function resetEstimates(sessionId: string, participantId: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker)
      throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can reset estimates');
    session.estimates.forEach((e) => {
      e.storedValue = null;
      e.value = null;
      e.hasVoted = false;
    });
    session.revealed = false;
    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function closeSession(sessionId: string, participantId: string): boolean {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker)
      throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can close the session');
    sessionsById.delete(sessionId);
    sessionsByCode.delete(session.code);
    persist();
    pubsub.publish(`SESSION_${session.id}_CLOSED`, { sessionClosed: session.id });
    return true;
  }

  function reconnectParticipant(sessionId: string, participantId: string): Session {
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant)
      throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    participant.connected = true;
    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  function removeParticipant(sessionId: string, participantId: string): void {
    const session = sessionsById.get(sessionId);
    if (!session) return; // session may have already been closed
    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) return;
    participant.connected = false;
    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
  }

  function pickStoryPoints(sessionId: string, participantId: string, points: string): Session {
    if (!VALID_CARD_VALUES.has(points)) {
      throw new Error(`Invalid story points value "${points}".`);
    }
    const session = sessionsById.get(sessionId);
    if (!session) throw new Error(`Session with id ${sessionId} not found`);
    const asker = session.participants.find((p) => p.id === participantId);
    if (!asker)
      throw new Error(`Participant with id ${participantId} not found in session ${sessionId}`);
    if (!asker.isHost) throw new Error('Only the host can pick story points');
    if (!session.revealed) throw new Error('Votes must be revealed before picking story points');

    // Save the current story if it has a title
    if (session.storyTitle) {
      session.completedStories = session.completedStories ?? [];
      session.completedStories.push({ title: session.storyTitle, points });
    }

    // Reset estimates and clear the current story
    session.estimates.forEach((e) => {
      e.storedValue = null;
      e.value = null;
      e.hasVoted = false;
    });
    session.revealed = false;
    session.storyTitle = null;
    session.storyContext = null;

    touch(session);
    sessionsById.set(session.id, session);
    persist();
    pubsub.publish(`SESSION_${session.id}_UPDATED`, { sessionUpdated: toSessionView(session) });
    return toSessionView(session);
  }

  return {
    createSession,
    joinSession,
    submitEstimate,
    revealVotes,
    resetEstimates,
    getSession,
    getSessionByCode,
    setStoryTitle,
    setStoryContext,
    closeSession,
    removeParticipant,
    reconnectParticipant,
    pickStoryPoints,
    pruneExpired,
  };
}
