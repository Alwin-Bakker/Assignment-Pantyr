export type Participant = {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
};

export type Estimate = {
  participantId: string;
  value: string | null; // null when hidden
  hasVoted: boolean;
  storedValue?: string | null; // internal storage before reveal
};

export type Session = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  participants: Participant[];
  estimates: Estimate[];
  revealed: boolean;
  storyTitle?: string | null;
};

export type JoinSessionResult = {
  session: Session;
  participant: Participant;
};
