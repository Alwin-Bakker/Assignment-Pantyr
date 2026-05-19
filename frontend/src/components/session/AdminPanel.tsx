import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Eye, Trash2, XCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../Button';
import Input from '../Input';
import AlertDialog from '../ui/AlertDialog';
import { REVEAL_VOTES, RESET_ESTIMATES, CLOSE_SESSION, SET_STORY_TITLE, SET_STORY_CONTEXT } from '../../graphql/operations';
import type { SessionData } from '../../hooks/useSessionData';
import { useNavigate } from 'react-router-dom';

type Props = {
  sessionId: string;
  participantId: string;
  session: SessionData;
  onRefetch: () => void;
};

export default function AdminPanel({ sessionId, participantId, session, onRefetch }: Props) {
  const navigate = useNavigate();
  const [titleDraft, setTitleDraft] = useState('');
  const [contextDraft, setContextDraft] = useState(session.storyContext ?? '');
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [revealVotes] = useMutation(REVEAL_VOTES);
  const [resetEstimates] = useMutation(RESET_ESTIMATES);
  const [closeSession] = useMutation(CLOSE_SESSION);
  const [setStoryTitle] = useMutation(SET_STORY_TITLE);
  const [setStoryContext] = useMutation(SET_STORY_CONTEXT);

  const estimates = session.estimates;
  const votesCount = estimates.filter((e) => e.hasVoted).length;
  const allVoted = estimates.length > 0 && estimates.every((e) => e.hasVoted);

  const handleReveal = () => {
    if (!allVoted) {
      setShowRevealConfirm(true);
    } else {
      doReveal();
    }
  };

  const doReveal = async () => {
    try {
      await revealVotes({ variables: { sessionId, participantId } });
      onRefetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      await resetEstimates({ variables: { sessionId, participantId } });
      onRefetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetTitle = async () => {
    if (!titleDraft.trim()) return;
    try {
      await setStoryTitle({ variables: { sessionId, participantId, title: titleDraft } });
      setTitleDraft('');
      onRefetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetContext = async () => {
    try {
      await setStoryContext({ variables: { sessionId, participantId, context: contextDraft } });
      toast.success('Story context saved');
      onRefetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async () => {
    try {
      await closeSession({ variables: { sessionId, participantId } });
      navigate('/', { replace: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <Input
          id="story-title"
          label="Story title"
          placeholder="Add a short title"
          value={titleDraft}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitleDraft(e.target.value)}
        />
        <Button
          className="w-full"
          onClick={handleSetTitle}
          disabled={!titleDraft.trim()}
          variant="primary"
        >
          <Edit size={16} /> Set story title
        </Button>

        <Input
          id="story-context"
          label="Story context"
          placeholder="Add details about the story"
          multiline
          rows={4}
          value={contextDraft}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContextDraft(e.target.value)}
        />
        <Button className="w-full" onClick={handleSetContext} variant="secondary">
          Save context
        </Button>

        <Button
          className="w-full"
          onClick={handleReveal}
          disabled={votesCount === 0 || session.revealed}
          variant="secondary"
        >
          <Eye size={16} /> Reveal estimates
        </Button>

        <Button
          className="w-full"
          onClick={handleReset}
          disabled={votesCount === 0}
          variant="danger"
        >
          <Trash2 size={16} /> Reset round
        </Button>

        <Button
          className="w-full"
          onClick={() => setShowCloseConfirm(true)}
          variant="danger"
        >
          <XCircle size={16} /> Close session
        </Button>
      </div>

      <AlertDialog
        open={showRevealConfirm}
        onOpenChange={setShowRevealConfirm}
        title="Reveal estimates?"
        description="Not everyone has voted yet. Reveal anyway?"
        confirmLabel="Reveal"
        cancelLabel="Cancel"
        onConfirm={doReveal}
      />
      <AlertDialog
        open={showCloseConfirm}
        onOpenChange={setShowCloseConfirm}
        title="Close session?"
        description="This will remove the session for all participants."
        confirmLabel="Close session"
        cancelLabel="Cancel"
        onConfirm={handleClose}
      />
    </>
  );
}
