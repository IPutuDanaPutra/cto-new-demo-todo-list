import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/todo platform/i)).toBeInTheDocument();
  });

  it('displays the dashboard page by default', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /dashboard/i })
    ).toBeInTheDocument();
  });
});
