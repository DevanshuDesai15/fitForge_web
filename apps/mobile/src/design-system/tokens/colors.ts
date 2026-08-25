export const colors = {
  accent: '#dded00',
  accentPress: '#e3ef3f',
  accentInk: '#121212',
  accentWash: 'rgba(221, 237, 0, 0.08)',
  accentWashStrong: 'rgba(221, 237, 0, 0.15)',
  surface: {
    canvas: '#121212', card: '#282828', quiet: '#1a1a1a', raised: '#282828',
    sunken: '#0d0d0d', nav: '#212121', metric: '#2a2a2a',
    inset: 'rgba(0, 0, 0, 0.30)', hover: 'rgba(255, 255, 255, 0.05)',
    active: 'rgba(255, 255, 255, 0.08)', panel: 'rgba(30, 30, 30, 0.90)',
  },
  text: {
    primary: '#ffffff', secondary: '#8b8b8b', muted: 'rgba(255, 255, 255, 0.72)',
    hint: 'rgba(255, 255, 255, 0.60)', disabled: 'rgba(255, 255, 255, 0.42)',
    faint: 'rgba(255, 255, 255, 0.35)', onAccent: '#121212',
  },
  border: {
    light: 'rgba(255, 255, 255, 0.04)', main: 'rgba(255, 255, 255, 0.08)',
    strong: 'rgba(255, 255, 255, 0.16)', accent: 'rgba(221, 237, 0, 0.28)',
    accentStrong: 'rgba(221, 237, 0, 0.50)',
  },
  status: {
    error: '#ef4444', errorInk: '#f87171', errorWash: 'rgba(239, 68, 68, 0.20)',
    warning: '#f59e0b', warningInk: '#facc15', warningWash: 'rgba(234, 179, 8, 0.20)',
    success: '#4caf50', successWash: 'rgba(76, 175, 80, 0.15)',
    info: '#60a5fa', infoWash: 'rgba(59, 130, 246, 0.20)',
  },
  data: {
    cool: '#4a8af5', coolEnd: '#7bb8ff', warm: '#f5734a', warmEnd: '#ffab76',
    track: 'rgba(255, 255, 255, 0.06)', heatEmpty: 'rgba(255, 255, 255, 0.07)',
    heatOn: '#dded00',
  },
} as const;
