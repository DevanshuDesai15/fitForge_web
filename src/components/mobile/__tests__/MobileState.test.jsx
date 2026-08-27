import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MobileState from '../MobileState';
import MobileTabs from '../MobileTabs';

describe('MobileState', () => {
  it('offers a retry action for a failed load', () => {
    const retry = vi.fn();
    render(<MobileState kind="failure" title="Could not load" onRetry={retry} />);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
  });

  it('marks skeleton content busy and degraded service information as status', () => {
    const { rerender } = render(<MobileState kind="loading" title="Loading workouts" />);
    expect(screen.getByLabelText(/loading workouts/i)).toHaveAttribute('aria-busy', 'true');

    rerender(<MobileState kind="degraded" title="AI coach is using offline guidance" />);
    expect(screen.getByRole('status')).toHaveTextContent(/offline guidance/i);
  });

  it('presents an empty state without announcing an error', () => {
    render(<MobileState kind="empty" title="No workouts yet" />);

    expect(screen.getByText('No workouts yet')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('MobileTabs', () => {
  it('exposes selected tab state and reports changes', () => {
    const change = vi.fn();
    render(
      <MobileTabs
        value="programs"
        onChange={change}
        ariaLabel="Workout sections"
        tabs={[
          { id: 'workouts', label: 'Workouts' },
          { id: 'programs', label: 'Programs' },
          { id: 'library', label: 'Library' },
        ]}
      />,
    );

    expect(screen.getByRole('tablist', { name: /workout sections/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Programs' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: 'Library' }));
    expect(change).toHaveBeenCalledWith('library');
  });
});
