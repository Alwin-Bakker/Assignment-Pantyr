import { gql } from '@apollo/client';

export const CREATE_SESSION = gql`
  mutation CreateSession($name: String!) {
    createSession(name: $name) {
      session { id code }
      participant { id name isHost }
    }
  }
`;

export const JOIN_SESSION = gql`
  mutation JoinSession($code: String!, $name: String!) {
    joinSession(code: $code, name: $name) {
      session { id code }
      participant { id name isHost }
    }
  }
`;

export const SUBMIT_ESTIMATE = gql`
  mutation SubmitEstimate($sessionId: ID!, $participantId: ID!, $value: String!) {
    submitEstimate(sessionId: $sessionId, participantId: $participantId, value: $value) {
      id
      estimates { participantId value hasVoted }
      revealed
    }
  }
`;

export const RESET_ESTIMATES = gql`
  mutation ResetEstimates($sessionId: ID!, $participantId: ID!) {
    resetEstimates(sessionId: $sessionId, participantId: $participantId) {
      id
      revealed
      estimates { participantId value hasVoted }
    }
  }
`;

export const REVEAL_VOTES = gql`
  mutation RevealVotes($sessionId: ID!, $participantId: ID!) {
    revealVotes(sessionId: $sessionId, participantId: $participantId) {
      id
      revealed
      estimates { participantId value hasVoted }
    }
  }
`;

export const LEAVE_SESSION = gql`
  mutation LeaveSession($sessionId: ID!, $participantId: ID!) {
    leaveSession(sessionId: $sessionId, participantId: $participantId)
  }
`;

export const GET_SESSION = gql`
  query GetSession($id: ID!) {
    getSession(id: $id) {
      id
      code
      storyTitle
      storyContext
      participants { id name connected }
      estimates { participantId value hasVoted }
      revealed
    }
  }
`;

export const CLOSE_SESSION = gql`
  mutation CloseSession($sessionId: ID!, $participantId: ID!) {
    closeSession(sessionId: $sessionId, participantId: $participantId)
  }
`;

export const SET_STORY_TITLE = gql`
  mutation SetStoryTitle($sessionId: ID!, $participantId: ID!, $title: String!) {
    setStoryTitle(sessionId: $sessionId, participantId: $participantId, title: $title) {
      id
      storyTitle
    }
  }
`;

export const SET_STORY_CONTEXT = gql`
  mutation SetStoryContext($sessionId: ID!, $participantId: ID!, $context: String!) {
    setStoryContext(sessionId: $sessionId, participantId: $participantId, context: $context) {
      id
      storyContext
    }
  }
`;

export const GET_SESSION_BY_CODE = gql`
  query GetSessionByCode($code: String!) {
    getSessionByCode(code: $code) {
      id
      code
      storyTitle
      storyContext
      participants { id name }
      estimates { participantId value hasVoted }
      revealed
    }
  }
`;

export const ON_SESSION_UPDATED = gql`
  subscription OnSessionUpdated($sessionId: ID!) {
    sessionUpdated(sessionId: $sessionId) {
      id
      code
      participants { id name connected }
      estimates { participantId value hasVoted }
      revealed
      storyTitle
      storyContext
    }
  }
`;

export const ON_SESSION_CLOSED = gql`
  subscription OnSessionClosed($sessionId: ID!) {
    sessionClosed(sessionId: $sessionId)
  }
`;

