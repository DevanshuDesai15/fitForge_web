import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { AISuggestionCard, Alert, BottomNav, Dialog, ProgressRing, SetRow, Tabs } from '..';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean; __DEV__: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

const render = (element: React.ReactElement) => {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(element as never); });
  return renderer!;
};

describe('design-system component states', () => {
  it('enforces the four-item bottom navigation contract and exposes selected tabs', () => {
    const items = [
      { value: 'home', label: 'Home', icon: 'home' as const },
      { value: 'workouts', label: 'Workouts', icon: 'dumbbell' as const },
      { value: 'progress', label: 'Progress', icon: 'bar-chart-3' as const },
      { value: 'profile', label: 'Profile', icon: 'user' as const },
    ];
    const renderer = render(<BottomNav items={items} value="home" />);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Home' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(() => render(<BottomNav items={items.slice(0, 3)} />)).toThrow('exactly four');
  });

  it('changes tabs and exposes alert/dialog feedback semantics', () => {
    const change = vi.fn();
    const close = vi.fn();
    const renderer = render(<><Tabs tabs={[{ id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }]} value="week" onChange={change} /><Alert tone="error" onClose={close}>Failed</Alert><Dialog open title="Confirm">Body</Dialog></>);
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Month' }).props.onPress());
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Close alert' }).props.onPress());
    expect(change).toHaveBeenCalledWith('month');
    expect(close).toHaveBeenCalledOnce();
    expect(renderer.root.findByProps({ accessibilityRole: 'alert' })).toBeDefined();
    expect(renderer.root.findByProps({ accessibilityViewIsModal: true })).toBeDefined();
  });

  it('clamps AI confidence and exposes workout completion state', () => {
    const complete = vi.fn();
    const renderer = render(<><AISuggestionCard title="Load" description="Add weight" confidence={1.8} /><SetRow index={2} weight={100} reps={5} completed onComplete={complete} /></>);
    expect(renderer.root.findByProps({ accessibilityLabel: '100% confidence' })).toBeDefined();
    const checkbox = renderer.root.findByProps({ accessibilityRole: 'checkbox' });
    expect(checkbox.props.accessibilityState).toMatchObject({ checked: true });
    act(() => checkbox.props.onPress());
    expect(complete).toHaveBeenCalledOnce();
  });

  it('uses both configured endpoints in the progress-ring gradient', () => {
    const renderer = render(<ProgressRing current={4} target={8} colorStart="#111111" colorEnd="#eeeeee" />);
    const stops = renderer.root.findAll((node) => node.type === 'stop');
    expect(stops.map((node) => node.props.stopColor)).toEqual(['#111111', '#eeeeee']);
  });
});
