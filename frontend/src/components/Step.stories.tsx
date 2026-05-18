import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Step from './Step';
import { UserCheck } from 'lucide-react';

const meta: Meta<typeof Step> = {
  title: 'Components/Step',
  component: Step,
};

export default meta;
type Story = StoryObj<typeof Step>;

export const Default: Story = {
  args: {
    Icon: UserCheck,
    title: 'Vote',
    description: 'Submit estimates',
  },
};
