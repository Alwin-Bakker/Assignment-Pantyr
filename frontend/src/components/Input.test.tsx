import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Input from './Input';

describe('Input', () => {
  it('renders a label and input', () => {
    render(<Input id="name" label="Your name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input id="name" label="Name" value="" onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'Alice');
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders a textarea when multiline=true', () => {
    render(<Input id="ctx" label="Context" multiline value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  it('renders an input element by default', () => {
    render(<Input id="single" label="Single" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').tagName).toBe('INPUT');
  });
});
