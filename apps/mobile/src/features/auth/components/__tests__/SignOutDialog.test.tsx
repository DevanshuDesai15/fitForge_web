import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { SignOutDialog } from '../SignOutDialog';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const render = (element: React.ReactElement) => { let renderer: ReactTestRenderer; act(() => { renderer = create(element as never); }); return renderer!; };
const text = (renderer: ReactTestRenderer) => JSON.stringify(renderer.toJSON());

describe('SignOutDialog', () => {
  it('does not claim pending work is already synchronized', () => {
    const renderer = render(<SignOutDialog open pendingCount={2} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(text(renderer)).toContain('2 local changes have not synced yet');
    expect(text(renderer)).toContain('Supabase data remains the source of truth');
    expect(text(renderer)).not.toContain('already saved');
  });

  it('shows the safe cloud-data message when nothing is pending', () => {
    const renderer = render(<SignOutDialog open pendingCount={0} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(text(renderer)).toContain('cloud-synced data remains');
  });
});
