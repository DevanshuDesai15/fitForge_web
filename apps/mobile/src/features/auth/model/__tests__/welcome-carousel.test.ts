import { describe, expect, it } from 'vitest';
import { slideIndexFromOffset } from '../welcome-carousel';

describe('slideIndexFromOffset', () => {
  it('rounds a horizontal page offset and bounds it to the carousel', () => {
    expect(slideIndexFromOffset(410, 390, 3)).toBe(1);
    expect(slideIndexFromOffset(-40, 390, 3)).toBe(0);
    expect(slideIndexFromOffset(2000, 390, 3)).toBe(2);
  });

  it('keeps the first slide when the viewport is not measurable', () => {
    expect(slideIndexFromOffset(400, 0, 3)).toBe(0);
  });
});
