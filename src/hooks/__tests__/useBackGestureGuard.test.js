import { StrictMode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useBackGestureGuard from '../useBackGestureGuard';

const guarded = () => Boolean(window.history.state?.ffGuard);

describe('useBackGestureGuard', () => {
  it('turns a back swipe into onBack and keeps the guard in place', async () => {
    window.history.pushState({ page: 'start' }, '');
    const onBack = vi.fn();
    const view = renderHook(() => useBackGestureGuard(true, onBack));
    expect(guarded()).toBe(true);
    expect(window.history.state.page).toBe('start');

    window.history.back();
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(guarded()).toBe(true);

    window.history.back();
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(2));
    view.unmount();
    await waitFor(() => expect(guarded()).toBe(false));
  });

  it('does nothing while inactive, and removes its entry when deactivated', async () => {
    window.history.pushState({ page: 'other' }, '');
    const onBack = vi.fn();
    const view = renderHook(({ active }) => useBackGestureGuard(active, onBack), { initialProps: { active: false } });
    expect(guarded()).toBe(false);

    view.rerender({ active: true });
    expect(guarded()).toBe(true);
    view.rerender({ active: false });
    await waitFor(() => expect(guarded()).toBe(false));
    expect(window.history.state.page).toBe('other');
    expect(onBack).not.toHaveBeenCalled();
  });

  it('does not stack a second entry when the page was reloaded onto one', () => {
    window.history.pushState({ ffGuard: true }, '');
    const before = window.history.length;
    renderHook(() => useBackGestureGuard(true, vi.fn()));
    expect(window.history.length).toBe(before);
  });
  it('survives the double mount StrictMode does in development', async () => {
    window.history.pushState({ page: 'strict' }, '');
    const onBack = vi.fn();
    renderHook(() => useBackGestureGuard(true, onBack), { wrapper: StrictMode });
    await Promise.resolve();
    await Promise.resolve();
    expect(guarded()).toBe(true);

    window.history.back();
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
  });
});
