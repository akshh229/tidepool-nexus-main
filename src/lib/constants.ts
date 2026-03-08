export const COLORS = {
  cream: '#faf7f2',
  offWhite: '#f5f0e8',
  softCream: '#fdfaf5',
  deepBrown: '#1a1208',
  deepest: '#12100a',
  midDark: '#221a10',
  amber: '#e8a838',
  burnt: '#d46a2e',
  sand: '#c9b99a',
  mutedGold: '#b8860b',
  charcoal: '#1c1917',
  dangerRed: '#c0392b',
} as const;

export const FONTS = {
  heading: "'Playfair Display', serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const MAX_ENERGY = 300;
export const MAX_STEPS = 20000;
export const MAX_TRIALS = 30;
export const MAX_NEURONS = 500;
export const MAX_CONNECTIONS = 10000;

export const SCORE_ROWS = [
  { label: 'Survival', key: 'survivalFraction' as const, max: 8 },
  { label: 'Foraging Accuracy', key: 'foragingAccuracy' as const, max: 8 },
  { label: 'Adaptation Speed', key: 'adaptationScore' as const, max: 8 },
  { label: 'Predator Avoidance', key: 'predatorAvoidance' as const, max: 6 },
  { label: 'Shelter Timing', key: 'shelterTiming' as const, max: 6 },
  { label: 'Nav Efficiency', key: 'navigationEfficiency' as const, max: 6 },
  { label: 'Activity Efficiency', key: 'activityEfficiency' as const, max: 8 },
] as const;

export const SCENARIO_INFO: Record<string, string> = {
  baseline: 'Standard conditions / All systems nominal',
  heatwave: '🌡 Energy drain ×1.8 / Food nutrition −15% / Chem noise ×1.2',
  polluted: '🧪 Chemical noise ×2.5 / Random energy events',
};
