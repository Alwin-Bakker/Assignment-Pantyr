import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PubSub } from 'graphql-subscriptions';
import { createSessionService } from '../domain/sessionService';

describe('sessionService', () => {
  let service: ReturnType<typeof createSessionService>;
  let pubsub: PubSub;

  beforeEach(() => {
    pubsub = new PubSub();
    service = createSessionService(pubsub);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── createSession ────────────────────────────────────────────────────────

  it('creates a session and makes the creator host', () => {
    const result = service.createSession('User');

    expect(result.session.code).toBeTruthy();
    expect(result.participant.name).toBe('User');
    expect(result.participant.isHost).toBe(true);
    expect(result.participant.connected).toBe(true);
    expect(result.session.participants).toHaveLength(1);
  });

  // ── joinSession ──────────────────────────────────────────────────────────

  it('allows another participant to join by code', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    expect(joined.session.participants).toHaveLength(2);
    expect(joined.participant.name).toBe('Bob');
    expect(joined.participant.isHost).toBe(false);
  });

  it('throws when joining with an unknown code', () => {
    expect(() => service.joinSession('BADCODE', 'Bob')).toThrow('not found');
  });

  // ── submitEstimate ───────────────────────────────────────────────────────

  it('hides estimates until all participants have voted', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    const afterFirst = service.submitEstimate(created.session.id, created.participant.id, '8');
    const userEstimate = afterFirst.estimates.find(
      (e) => e.participantId === created.participant.id,
    );

    // Values are hidden while voting is in progress
    expect(userEstimate?.hasVoted).toBe(true);
    expect(userEstimate?.value).toBeNull();

    // When all active participants have voted and nobody is disconnected the
    // host must reveal manually — no automatic reveal fires.
    const afterSecond = service.submitEstimate(created.session.id, joined.participant.id, '5');
    expect(afterSecond.revealed).toBe(false);
    expect(
      afterSecond.estimates.find((e) => e.participantId === created.participant.id)?.value,
    ).toBeNull();

    // Host manually reveals — now values become visible.
    const afterReveal = service.revealVotes(created.session.id, created.participant.id);
    expect(afterReveal.revealed).toBe(true);
    expect(
      afterReveal.estimates.find((e) => e.participantId === created.participant.id)?.value,
    ).toBe('8');
  });

  it('rejects an invalid card value', () => {
    const created = service.createSession('User');
    expect(() =>
      service.submitEstimate(created.session.id, created.participant.id, 'banana'),
    ).toThrow('Invalid estimate value');
  });

  it('cannot vote after votes have been revealed', () => {
    const created = service.createSession('User');
    service.revealVotes(created.session.id, created.participant.id);
    expect(() => service.submitEstimate(created.session.id, created.participant.id, '3')).toThrow(
      'Cannot vote after votes have been revealed',
    );
  });

  // ── revealVotes ──────────────────────────────────────────────────────────

  it('only the host can reveal votes', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    expect(() => service.revealVotes(created.session.id, joined.participant.id)).toThrow(
      'Only the host can reveal votes',
    );
  });

  // ── resetEstimates ───────────────────────────────────────────────────────

  it('resets estimates for a new round', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    service.submitEstimate(created.session.id, created.participant.id, '8');
    service.submitEstimate(created.session.id, joined.participant.id, '5');

    const reset = service.resetEstimates(created.session.id, created.participant.id);

    expect(reset.revealed).toBe(false);
    expect(reset.estimates.every((e) => e.hasVoted === false)).toBe(true);
    expect(reset.estimates.every((e) => e.value === null)).toBe(true);
  });

  it('does not allow a non-host to reset estimates', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    expect(() => service.resetEstimates(created.session.id, joined.participant.id)).toThrow(
      'Only the host can reset estimates',
    );
  });

  // ── setStoryTitle ────────────────────────────────────────────────────────

  it('only the host can set the story title', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    expect(() => service.setStoryTitle(created.session.id, joined.participant.id, 'Story')).toThrow(
      'Only the host can set the story title',
    );
  });

  it('rejects an empty or whitespace story title', () => {
    const created = service.createSession('User');
    expect(() => service.setStoryTitle(created.session.id, created.participant.id, '   ')).toThrow(
      'Story title cannot be empty',
    );
  });

  // ── closeSession ─────────────────────────────────────────────────────────

  it('only the host can close the session', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    expect(() => service.closeSession(created.session.id, joined.participant.id)).toThrow(
      'Only the host can close the session',
    );
  });

  // ── removeParticipant ────────────────────────────────────────────────────

  it('marks a disconnected participant as not connected', () => {
    const created = service.createSession('Host');
    const joined = service.joinSession(created.session.code, 'Bob');

    service.removeParticipant(created.session.id, joined.participant.id);

    const session = service.getSession(created.session.id);
    const bob = session.participants.find((p) => p.id === joined.participant.id);
    expect(bob?.connected).toBe(false);
  });

  it('does NOT auto-reveal when a participant disconnects', () => {
    const created = service.createSession('Host');
    const joined = service.joinSession(created.session.code, 'Bob');

    // Host votes, then Bob disconnects without voting
    service.submitEstimate(created.session.id, created.participant.id, '5');
    service.removeParticipant(created.session.id, joined.participant.id);

    // Session should NOT be auto-revealed — host must reveal manually
    const session = service.getSession(created.session.id);
    expect(session.revealed).toBe(false);
  });

  it('does NOT auto-reveal even when all remaining active participants have voted', () => {
    const created = service.createSession('Host');
    const joined = service.joinSession(created.session.code, 'Bob');

    // Bob disconnects, then Host votes — no auto-reveal should fire
    service.removeParticipant(created.session.id, joined.participant.id);
    const after = service.submitEstimate(created.session.id, created.participant.id, '8');
    expect(after.revealed).toBe(false);
  });

  // ── pruneExpired ─────────────────────────────────────────────────────────

  it('prunes sessions that have exceeded the TTL', () => {
    const svc = createSessionService(new PubSub(), -1); // ttlMs=-1: any session is immediately expired
    const { session } = svc.createSession('Host');
    svc.pruneExpired();
    expect(() => svc.getSession(session.id)).toThrow('not found');
  });

  it('keeps sessions within the TTL', () => {
    const svc = createSessionService(new PubSub(), 60_000); // 1-minute TTL
    const { session } = svc.createSession('Host');
    svc.pruneExpired();
    expect(() => svc.getSession(session.id)).not.toThrow();
  });

  // ── subscription topic isolation ─────────────────────────────────────────

  it('sessionUpdated publishes to the UPDATED topic, not CLOSED', async () => {
    const created = service.createSession('User');
    const updatedMessages: unknown[] = [];
    const closedMessages: unknown[] = [];

    const updatedIter = pubsub.asyncIterator<unknown>(`SESSION_${created.session.id}_UPDATED`);
    const closedIter = pubsub.asyncIterator<unknown>(`SESSION_${created.session.id}_CLOSED`);

    // Consume one message from each iterator in background
    updatedIter.next().then((v) => updatedMessages.push(v.value));
    closedIter.next().then((v) => closedMessages.push(v.value));

    service.joinSession(created.session.code, 'Bob');
    await new Promise((r) => setTimeout(r, 10));

    expect(updatedMessages).toHaveLength(1);
    expect(closedMessages).toHaveLength(0);
  });

  it('closeSession publishes to the CLOSED topic, not UPDATED', async () => {
    const created = service.createSession('User');
    const updatedMessages: unknown[] = [];
    const closedMessages: unknown[] = [];

    const updatedIter = pubsub.asyncIterator<unknown>(`SESSION_${created.session.id}_UPDATED`);
    const closedIter = pubsub.asyncIterator<unknown>(`SESSION_${created.session.id}_CLOSED`);

    updatedIter.next().then((v) => updatedMessages.push(v.value));
    closedIter.next().then((v) => closedMessages.push(v.value));

    service.closeSession(created.session.id, created.participant.id);
    await new Promise((r) => setTimeout(r, 10));

    expect(closedMessages).toHaveLength(1);
    expect(updatedMessages).toHaveLength(0);
  });
});
