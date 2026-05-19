import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Feature from './Feature';

describe('Feature', () => {
  it('renders title and description', () => {
    render(<Feature title="Clear voting" description="Votes stay hidden." />);
    expect(screen.getByText('Clear voting')).toBeInTheDocument();
    expect(screen.getByText('Votes stay hidden.')).toBeInTheDocument();
  });
});
