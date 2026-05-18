import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AlertDialog from './ui/AlertDialog';

const meta: Meta<typeof AlertDialog> = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
};

export default meta;
type Story = StoryObj<typeof AlertDialog>;

export const OpenDialog: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open</button>
          <AlertDialog
            open={open}
            onOpenChange={setOpen}
            title="Confirm action"
            description="Are you sure you want to perform this action?"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            onConfirm={async () => {
              // dummy confirm
            }}
          />
        </div>
      );
    };
    return <Demo />;
  },
};
