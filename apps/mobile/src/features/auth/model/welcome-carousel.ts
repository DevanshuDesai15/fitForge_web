export function slideIndexFromOffset(offset: number, viewportWidth: number, slideCount: number) {
  if (viewportWidth <= 0 || slideCount <= 0) return 0;
  return Math.min(slideCount - 1, Math.max(0, Math.round(offset / viewportWidth)));
}
