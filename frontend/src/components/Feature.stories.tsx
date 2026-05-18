import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Feature from './Feature';

const meta: Meta<typeof Feature> = {
  title: 'Components/Feature',
  component: Feature,
};

export default meta;
type Story = StoryObj<typeof Feature>;

export const Default: Story = {
  args: {
    title: 'Clear voting',
    description: 'Estimates stay hidden until every participant has voted.',
  },
};
