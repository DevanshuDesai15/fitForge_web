import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { Button, CodeInput, ProgressBar, SelectableRow, Switch } from '..';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const render = (element: React.ReactElement) => {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(element as never); });
  return renderer!;
};

describe('interactive native primitives', () => {
  it('blocks disabled and loading button presses while exposing state', () => {
    const press = vi.fn();
    const renderer = render(<Button disabled onPress={press}>Save</Button>);
    const button = renderer.root.findByProps({ accessibilityRole: 'button' });
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    act(() => renderer.update(<Button loading onPress={press}>Save</Button>));
    expect(renderer.root.findByProps({ accessibilityRole: 'button' }).props.accessibilityState).toMatchObject({ busy: true });
  });

  it('exposes selectable and switch state without using color alone', () => {
    const toggle = vi.fn();
    const renderer = render(<><SelectableRow title="Strength" selected /><Switch label="Notifications" checked onChange={toggle} /></>);
    expect(renderer.root.findByProps({ accessibilityRole: 'radio' }).props.accessibilityState).toMatchObject({ checked: true });
    act(() => renderer.root.findByProps({ accessibilityRole: 'switch' }).props.onPress());
    expect(toggle).toHaveBeenCalledWith(false);
  });

  it('filters verification input to digits and completes at the requested length', () => {
    const change = vi.fn(); const complete = vi.fn();
    const renderer = render(<CodeInput length={4} value="" onChange={change} onComplete={complete} />);
    const input = renderer.root.findAll((node) => typeof node.props.onChangeText === 'function')[0];
    act(() => input.props.onChangeText('1a23-4'));
    expect(change).toHaveBeenCalledWith('1234');
    expect(complete).toHaveBeenCalledWith('1234');
  });

  it('clamps progress accessibility values', () => {
    const renderer = render(<ProgressBar value={120} max={100} label="Weekly goal" />);
    expect(renderer.root.findByProps({ accessibilityRole: 'progressbar' }).props.accessibilityValue).toMatchObject({ now: 100 });
  });
});
