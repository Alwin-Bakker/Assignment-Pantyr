import React from 'react';

type Participant = { id: string; name: string; connected: boolean };
type Estimate = { participantId: string; value: string | null; hasVoted: boolean };

type Props = {
  participants: Participant[];
  estimates: Estimate[];
  participantId: string;
};

export default function ParticipantList({ participants, estimates, participantId }: Props) {
  return (
    <ul className="mt-2 space-y-2">
      {participants.map((p) => {
        const est = estimates.find((e) => e.participantId === p.id);
        const voted = Boolean(est?.hasVoted);
        const isMe = participantId === p.id;
        const inactive = p.connected === false;
        return (
          <li
            key={p.id}
            className={['flex items-center justify-between', inactive ? 'opacity-50' : ''].join(
              ' ',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={['font-medium', inactive ? 'text-p-grey line-through' : ''].join(' ')}
              >
                {p.name}
              </span>
              {isMe && (
                <span className="rounded-full bg-p-light border border-p-green px-2 py-1 text-xs font-medium text-p-dark">
                  You
                </span>
              )}
            </div>
            <div>
              {inactive ? (
                <span className="rounded-full bg-p-overlay px-2 py-1 text-xs font-medium text-p-grey">
                  Left
                </span>
              ) : voted ? (
                <span className="rounded-full bg-p-overlay px-2 py-1 text-xs font-medium text-p-dark">
                  Voted
                </span>
              ) : (
                <span className="rounded-full bg-p-bg px-2 py-1 text-xs font-medium text-p-grey">
                  Waiting
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
