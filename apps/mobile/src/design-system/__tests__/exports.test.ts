import { describe, expect, it } from 'vitest';
import * as system from '..';

const expected = [
  'AddRow', 'Badge', 'Button', 'Card', 'Chip', 'IconButton', 'SelectableRow', 'StatCard',
  'Heatmap', 'ProgressBar', 'ProgressRing', 'Alert', 'Dialog', 'EmptyState', 'Sheet',
  'Skeleton', 'Spinner', 'CodeInput', 'Input', 'Select', 'Switch', 'Textarea', 'Icon',
  'BottomNav', 'Sidebar', 'Tabs', 'AISuggestionCard', 'RestTimer', 'SetRow',
] as const;

describe('native design-system exports', () => {
  it('exports every primitive in the authoritative kit', () => {
    expect(expected).toHaveLength(29);
    const exportedNames = Object.keys(system);
    for (const name of expected) expect(exportedNames).toContain(name);
  });
});
