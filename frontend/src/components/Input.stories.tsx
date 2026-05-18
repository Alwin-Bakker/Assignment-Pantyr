import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const TextInput: Story = {
  args: {
    id: 'example-text',
    label: 'Your name',
    placeholder: 'e.g. Alex',
    value: '',
  },
};

export const TextArea: Story = {
  args: {
    id: 'example-textarea',
    label: 'Story context',
    multiline: true,
    rows: 4,
    value: 'Some long context...'
  },
};
