import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it } from 'vitest';
import { WelcomeScreen } from '../WelcomeScreen';
import { FitForgeLogo } from '../FitForgeLogo';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const render = () => { let renderer: ReactTestRenderer; act(() => { renderer = create(<WelcomeScreen /> as never); }); return renderer!; };

describe('WelcomeScreen design-system contract', () => {
  it('renders the RN-kit hex and three accessible dot indicators', () => {
    const renderer = render();
    expect(renderer.root.findByProps({ accessibilityLabel: 'FitForge' })).toBeDefined();
    const dots = renderer.root.findAll((node) => (node.type as unknown) === 'View' && node.props.accessibilityRole === 'tab' && String(node.props.accessibilityLabel).startsWith('Welcome slide'));
    expect(dots).toHaveLength(3);
    expect(dots[0].props.accessibilityState).toMatchObject({ selected: true });
  });

  it('contains the exact three live product previews from the RN kit', () => {
    const output = JSON.stringify(render().toJSON());
    expect(output).toContain('Every set. On the record.');
    expect(output).toContain('80 kg last time');
    expect(output).toContain('Increase Weight');
    expect(output).toContain('Deload Week');
    expect(output).toContain('activity:');
    expect(output).toContain('Skip');
    expect(output).toContain('Create your account');
    expect(output).toContain('Already training here? Sign in');
  });
});

describe('FitForgeLogo', () => {
  it('renders a mark-only variant for compact auth headers', () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<FitForgeLogo variant="mark" /> as never); });
    expect(JSON.stringify(renderer!.toJSON())).not.toContain('FITFORGE');
    expect(renderer!.root.findByProps({ accessibilityLabel: 'FitForge' })).toBeDefined();
  });
});
