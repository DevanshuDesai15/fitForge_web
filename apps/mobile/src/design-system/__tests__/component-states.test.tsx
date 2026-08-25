import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { AISuggestionCard, Alert, BottomNav, Dialog, Heatmap, ProgressRing, SetRow, Tabs } from '..';

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
    expect(renderer.root.findAllByType('TextInput' as never)).toHaveLength(0);
    const completionStyles = Array.isArray(checkbox.props.style) ? checkbox.props.style.flat().filter(Boolean) : [checkbox.props.style];
    expect(completionStyles).toContainEqual(expect.objectContaining({ width: 44, height: 22 }));
  });

  it('renders the fluid activity heatmap with registered day and month axes', () => {
    const renderer = render(<Heatmap year={2026} values={Array.from({ length: 371 }, (_, index) => index % 3 ? 0 : 1)} months={[{ label: 'Sep', weekIndex: 0 }, { label: 'Aug', weekIndex: 48 }]} totalWorkouts={124} workoutDays={365} fluid />);
    const output = JSON.stringify(renderer.toJSON());
    expect(output).toContain('2026 Workout Activity');
    expect(output).toContain('124 workouts in 365 days');
    expect(output).toContain('Less');
    expect(output).toContain('More');
    expect(output).toContain('Sep');
    expect(output).toContain('Aug');
  });

  it('uses both configured endpoints in the progress-ring gradient', () => {
    const renderer = render(<ProgressRing current={4} target={8} colorStart="#111111" colorEnd="#eeeeee" />);
    const stops = renderer.root.findAll((node) => node.type === 'stop');
    expect(stops.map((node) => node.props.stopColor)).toEqual(['#111111', '#eeeeee']);
  });
});
