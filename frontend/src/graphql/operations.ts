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
  mutation RevealVotes($sessionId: ID!) {
    revealVotes(sessionId: $sessionId) {
      id
      revealed
      estimates { participantId value hasVoted }
    }
  }
`;

export const GET_SESSION = gql`
  query GetSession($id: ID!) {
    getSession(id: $id) {
      id
      code
      storyTitle
      participants { id name }
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
