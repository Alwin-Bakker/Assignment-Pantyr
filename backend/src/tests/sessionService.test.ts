import { describe, it, expect, beforeEach } from 'vitest';
import { createSessionService } from '../domain/sessionService';

describe('sessionService', () => {
  let service: ReturnType<typeof createSessionService>;

  beforeEach(() => {
    service = createSessionService();
  });

  it('creates a session and makes the creator host', () => {
    const result = service.createSession('User');

    expect(result.session.code).toBeTruthy();
    expect(result.participant.name).toBe('User');
    expect(result.participant.isHost).toBe(true);
    expect(result.session.participants).toHaveLength(1);
  });

  it('allows another participant to join by code', () => {
    const created = service.createSession('User');

    const joined = service.joinSession(created.session.code, 'Bob');

    expect(joined.session.participants).toHaveLength(2);
    expect(joined.participant.name).toBe('Bob');
    expect(joined.participant.isHost).toBe(false);
  });

  it('hides estimates until all participants have voted', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    const sessionAfterFirstVote = service.submitEstimate(
      created.session.id,
      created.participant.id,
      '8'
    );

    const userEstimate = sessionAfterFirstVote.estimates.find(
      (e) => e.participantId === created.participant.id
    );

    expect(userEstimate?.hasVoted).toBe(true);
    expect(userEstimate?.value).toBeNull();

    const sessionAfterSecondVote = service.submitEstimate(
      created.session.id,
      joined.participant.id,
      '5'
    );

    const revealedEstimate = sessionAfterSecondVote.estimates.find(
      (e) => e.participantId === created.participant.id
    );

    expect(sessionAfterSecondVote.revealed).toBe(true);
    expect(revealedEstimate?.value).toBe('8');
  });

  it('resets estimates for a new round', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    service.submitEstimate(created.session.id, created.participant.id, '8');
    service.submitEstimate(created.session.id, joined.participant.id, '5');

    const resetSession = service.resetEstimates(
      created.session.id,
      created.participant.id
    );

    expect(resetSession.revealed).toBe(false);
    expect(resetSession.estimates.every((e) => e.hasVoted === false)).toBe(true);
    expect(resetSession.estimates.every((e) => e.value === null)).toBe(true);
  });

  it('does not allow a non-host to reset estimates', () => {
    const created = service.createSession('User');
    const joined = service.joinSession(created.session.code, 'Bob');

    expect(() =>
      service.resetEstimates(created.session.id, joined.participant.id)
    ).toThrow('Only the host can reset estimates');
  });
});
