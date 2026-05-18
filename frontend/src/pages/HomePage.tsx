import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useLocation } from 'react-router-dom';
import { CREATE_SESSION, JOIN_SESSION } from '../graphql/operations';
import Button from '../components/Button';
import Input from '../components/Input';
import Step from '../components/Step';
import Feature from '../components/Feature';
import logo from '../assets/logo.png';
import { PlusSquare, Link2, UserCheck, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [createSession, { data, loading, error }] = useMutation(CREATE_SESSION);
  const [joinSession, { loading: joinLoading, error: joinError }] = useMutation(JOIN_SESSION);
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invite = params.get('code') || params.get('invite');
    if (invite) setCode(invite);
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName) return;
    try {
      const res = await createSession({ variables: { name: createName } });
      const sess = res?.data?.createSession?.session;
      const participant = res?.data?.createSession?.participant;
      if (sess?.code) {
        navigate(`/session/${sess.code}`, { state: { sessionId: sess.id, participantId: participant.id, isHost: participant.isHost } });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !joinName) return;
    try {
      const res = await joinSession({ variables: { code, name: joinName } });
      const sess = res?.data?.joinSession?.session;
      const participant = res?.data?.joinSession?.participant;
      if (sess?.code) {
        navigate(`/session/${sess.code}`, { state: { sessionId: sess.id, participantId: participant.id, isHost: participant.isHost } });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_0.95fr] xl:gap-14">
          {/* Left side - marketing/features */}
          <div className="space-y-6 h-full flex flex-col justify-between">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <img src={logo} width={56} height={56} alt="Pantyr logo" className="block" />
              <h1 className="text-3xl md:text-5xl font-bold text-[#19a9a0]">Pantyr Poker</h1>
            </div>
            <p className="text-lg text-slate-700">Estimate stories with your team online. Built for the Pantyr full-stack assignment</p>

            <div className="grid gap-4 sm:grid-cols-2 mt-6 pb-6 border-b">
              <Feature
                title="Clear voting"
                description="Estimates stay hidden until every participant has voted."
              />
              <Feature
                title="Fast alignment"
                description="Compare results quickly and move the discussion forward."
              />
            </div>

            <div className="mt-6">
              <div className="flex justify-center md:justify-start items-stretch gap-2">
                <Step Icon={PlusSquare} title="Create" description="Start a session" />
                <div className="self-center px-1"><ArrowRight size={20} className="text-sky-600" /></div>
                <Step Icon={Link2} title="Invite" description="Share your session link" />
                <div className="self-center px-1"><ArrowRight size={20} className="text-sky-600" /></div>
                <Step Icon={UserCheck} title="Vote" description="Submit estimates" />
                <div className="self-center px-1"><ArrowRight size={20} className="text-sky-600" /></div>
                <Step Icon={Eye} title="Reveal" description="Show results" />
              </div>
            </div>
          </div>

          {/* Right side - actions */}
          <div className="space-y-6 h-full">
            <div className="p-6 border rounded-md bg-white shadow-sm">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">Start a session</h2>
                <p className="text-sm text-slate-600">
                  Create a room and invite teammates with a link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input id="create-name" label="Your name" placeholder="e.g. Alex" value={createName} onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setCreateName(e.target.value)} required aria-required="true" />
                <div className="flex items-center">
                  <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Start session'}</Button>
                </div>
                {error && <p className="text-red-600">Error creating session</p>}
              </form>
            </div>

            <div className="p-6 border rounded-md bg-white shadow-sm">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">Join a session</h2>
                <p className="text-sm text-slate-600">Enter the code you were invited to.</p>
              </div>

              <form onSubmit={handleJoin} className="mt-6 space-y-4">
                <Input id="join-name" label="Your name" placeholder="e.g. Alex" value={joinName} onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setJoinName(e.target.value)} required aria-required="true" />
                <Input id="join-code" label="Session code" placeholder="ABC123" value={code} onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setCode(e.target.value)} required aria-required="true" />
                <div className="flex items-center">
                  <Button type="submit" disabled={joinLoading}>{joinLoading ? 'Joining...' : 'Join session'}</Button>
                </div>
                {joinError && <p className="text-red-600">Error joining session</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
