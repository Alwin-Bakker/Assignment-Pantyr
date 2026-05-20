import React, { useEffect, useRef } from 'react';
import Button from '../Button';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
};

export default function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', onKey);
      // focus dialog
      setTimeout(() => dialogRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        ref={dialogRef}
        tabIndex={-1}
        className="z-50 bg-white rounded-md p-6 max-w-lg w-[90%] shadow-lg"
      >
        <h3 id="alert-dialog-title" className="text-lg font-medium">
          {title}
        </h3>
        {description && (
          <div id="alert-dialog-description" className="mt-2 text-sm text-p-grey">
            {description}
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
