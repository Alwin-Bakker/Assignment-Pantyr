import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AlertDialog from './ui/AlertDialog';

describe('AlertDialog', () => {
  it('does not render when closed', () => {
    render(
      <AlertDialog
        open={false}
        onOpenChange={() => {}}
        title="Are you sure?"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders title and description when open', () => {
    render(
      <AlertDialog
        open={true}
        onOpenChange={() => {}}
        title="Reveal estimates?"
        description="Not everyone has voted yet."
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Reveal estimates?')).toBeInTheDocument();
    expect(screen.getByText('Not everyone has voted yet.')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <AlertDialog
        open={true}
        onOpenChange={() => {}}
        title="Close session?"
        confirmLabel="Close"
        onConfirm={onConfirm}
      />
    );
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <AlertDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete?"
        onConfirm={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) on Escape key', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <AlertDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete?"
        onConfirm={vi.fn()}
      />
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
