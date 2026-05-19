import React from 'react';
import type { SessionData } from '../../hooks/useSessionData';

const CARD_ORDER = ['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '∞', '☕'];

type Props = {
  session: SessionData;
};

export default function ResultsPanel({ session }: Props) {
  const voted = session.estimates.filter((e) => e.hasVoted).length;
  const total = session.participants.length;

  /* ── Pre-reveal: masked cards per participant ── */
  if (!session.revealed) {
    return (
      <section data-testid="results-panel">
        <div className="mt-4 flex flex-wrap gap-3">
          {session.participants.map((p) => {
            const hasVoted = session.estimates.find((e) => e.participantId === p.id)?.hasVoted;
            return (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <div
                  className={[
                    'w-12 h-16 rounded-lg border-2 flex items-center justify-center text-lg font-bold shadow-sm transition-colors',
                    hasVoted
                      ? 'border-p-blue bg-p-blue text-white'
                      : 'border-p-green bg-white text-p-grey',
                  ].join(' ')}
                >
                  {hasVoted ? '✓' : '?'}
                </div>
                <span className="text-xs text-p-grey max-w-[48px] truncate text-center">
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-p-grey">
          {voted === 0
            ? 'Waiting for estimates…'
            : `${voted} of ${total} voted — hidden until revealed`}
        </p>
      </section>
    );
  }

  /* ── Post-reveal: grouped vote cards ── */
  const buckets: Record<string, string[]> = {};
  session.participants.forEach((p) => {
    const est = session.estimates.find((e) => e.participantId === p.id && e.value != null);
    if (est) {
      const val = String(est.value);
      buckets[val] = buckets[val] ?? [];
      buckets[val].push(p.name);
    }
  });

  const orderedValues = Object.keys(buckets).sort((a, b) => {
    const ia = CARD_ORDER.indexOf(a);
    const ib = CARD_ORDER.indexOf(b);
    return (ia === -1 ? CARD_ORDER.length : ia) - (ib === -1 ? CARD_ORDER.length : ib);
  });

  const maxCount = Math.max(...orderedValues.map((v) => buckets[v].length));
  const hasConsensus = orderedValues.length === 1;

  return (
    <section data-testid="results-panel">
      {/* Consensus banner */}
      {hasConsensus && (
        <div className="mt-3 mb-1 flex items-center gap-2 rounded-md bg-p-light border border-p-green px-4 py-2 text-sm font-semibold text-p-dark">
          <span>🎉</span>
          <span>Full consensus — everyone voted {orderedValues[0]}</span>
        </div>
      )}

      {/* Vote cards */}
      <div className="mt-3 flex flex-wrap gap-5">
        {orderedValues.map((val) => {
          const count = buckets[val].length;
          const isTop = count === maxCount;
          return (
            <div key={val} className="flex flex-col items-center gap-2">
              {/* Card face */}
              <div
                className={[
                  'w-16 h-24 flex items-center justify-center rounded-xl border-2 text-3xl font-bold shadow-sm',
                  isTop
                    ? 'border-p-blue bg-p-blue text-white'
                    : 'border-p-green bg-white text-p-dark',
                ].join(' ')}
              >
                {val}
              </div>
              {/* Vote count badge */}
              <span
                className={[
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  isTop
                    ? 'bg-p-blue/10 text-p-blue border border-p-blue/20'
                    : 'bg-p-bg text-p-grey',
                ].join(' ')}
              >
                {count} {count === 1 ? 'vote' : 'votes'}
              </span>
              {/* Name pills */}
              <div className="flex flex-col items-center gap-1">
                {buckets[val].map((name) => (
                  <span
                    key={name}
                    className="text-xs bg-p-light border border-p-green text-p-dark px-2 py-0.5 rounded-full whitespace-nowrap"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
