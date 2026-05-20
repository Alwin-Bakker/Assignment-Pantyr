export type Participant = {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  connected: boolean;
};

export type Estimate = {
  participantId: string;
  value: string | null; // null when hidden
  hasVoted: boolean;
  storedValue?: string | null; // internal storage before reveal
};

export type CompletedStory = {
  title: string;
  points: string;
};

export type Session = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  lastActivityAt: string;
  participants: Participant[];
  estimates: Estimate[];
  revealed: boolean;
  storyTitle?: string | null;
  storyContext?: string | null;
  completedStories: CompletedStory[];
};

export type JoinSessionResult = {
  session: Session;
  participant: Participant;
};

export type SessionService = {
  createSession(name: string): JoinSessionResult;
  joinSession(code: string, name: string): JoinSessionResult;
  submitEstimate(sessionId: string, participantId: string, value: string): Session;
  revealVotes(sessionId: string, participantId: string): Session;
  resetEstimates(sessionId: string, participantId: string): Session;
  setStoryTitle(sessionId: string, participantId: string, title: string): Session;
  setStoryContext(sessionId: string, participantId: string, context: string): Session;
  closeSession(sessionId: string, participantId: string): boolean;
  removeParticipant(sessionId: string, participantId: string): void;
  reconnectParticipant(sessionId: string, participantId: string): Session;
  pickStoryPoints(sessionId: string, participantId: string, points: string): Session;
  getSession(sessionId: string): Session;
  getSessionByCode(code: string): Session;
  pruneExpired(): void;
};
