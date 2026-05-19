import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Clipboard, QrCode, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../Button';

type Props = {
  code: string;
};

export default function InvitePanel({ code }: Props) {
  const [showQR, setShowQR] = useState(false);
  const invite = `${window.location.origin}/?code=${code}`;

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(invite);
        toast.success('Invite link copied to clipboard');
      } else {
        window.prompt('Copy this invite link', invite);
        toast('Invite link (copy from prompt)');
      }
    } catch (e) {
      console.error('Failed to copy invite link', e);
      toast.error('Failed to copy invite link');
    }
  };

  return (
    <>
      <div className="mt-4 flex gap-2">
        <Button onClick={copyLink}>
          <Clipboard size={16} /> Copy invite
        </Button>
        <Button onClick={() => setShowQR(true)}>
          <QrCode size={16} /> QR
        </Button>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-md shadow-lg w-[320px] relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-p-grey"
              aria-label="Close QR modal"
            >
              <XCircle />
            </button>
            <h3 className="text-lg font-medium mb-3">Invite QR</h3>
            <div className="flex justify-center">
              <QRCode value={invite} size={256} />
            </div>
            <div className="mt-4 flex justify-center">
              <Button onClick={copyLink}>
                <Clipboard size={16} /> Copy link
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
