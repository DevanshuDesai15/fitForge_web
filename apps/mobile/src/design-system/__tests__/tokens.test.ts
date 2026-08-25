import { describe, expect, it } from 'vitest';
import { colors, effects, fontFamilies, radii, sizes, spacing } from '../tokens';

describe('FitForge native tokens', () => {
  it('preserves the authoritative brand and semantic colors', () => {
    expect(colors.accent).toBe('#dded00');
    expect(colors.surface.canvas).toBe('#121212');
    expect(colors.surface.card).toBe('#282828');
    expect(colors.text.primary).toBe('#ffffff');
    expect(colors.status.error).toBe('#ef4444');
    expect(colors.data.cool).toBe('#4a8af5');
    expect(colors.data.warm).toBe('#f5734a');
  });

  it('preserves spacing, radius, touch, motion, and font contracts', () => {
    expect(spacing).toMatchObject({ 1: 4, 6: 24, 20: 80 });
    expect(radii).toMatchObject({ xs: 8, sm: 12, md: 16, lg: 20 });
    expect(sizes.tapMin).toBe(44);
    expect(effects.motion.durationFast).toBe(200);
    expect(fontFamilies).toEqual({ body: 'Archivo_400Regular', mono: 'JetBrainsMono_400Regular' });
  });
});
