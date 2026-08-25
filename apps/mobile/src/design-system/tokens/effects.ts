export const effects = {
  motion: { durationFast: 200, durationBase: 300, durationSlow: 1200 },
  shadow: {
    card: { shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
    raised: { shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    dialog: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 16 },
  },
  scrim: {
    sheet: 'rgba(0, 0, 0, 0.64)',
    dialog: 'rgba(0, 0, 0, 0.72)',
  },
} as const;
