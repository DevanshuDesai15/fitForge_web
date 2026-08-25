import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { describe, expect, it } from 'vitest';
import { AuthShell } from '../AuthShell';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('AuthShell', () => {
  it('keeps the authentication header below the iOS status bar', () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<AuthShell onBack={() => undefined}>Form</AuthShell> as never); });
    expect(renderer!.root.findByType(SafeAreaView as never).props.edges).toContain('top');
  });
});
