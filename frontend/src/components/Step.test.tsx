import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserCheck } from 'lucide-react';
import Step from './Step';

describe('Step', () => {
  it('renders title and description', () => {
    render(<Step Icon={UserCheck} title="Vote" description="Submit estimates" />);
    expect(screen.getByText('Vote')).toBeInTheDocument();
    expect(screen.getByText('Submit estimates')).toBeInTheDocument();
  });

  it('renders without description', () => {
    render(<Step Icon={UserCheck} title="Done" />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
});
