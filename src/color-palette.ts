export const PALETTE = [
  { hue: 259, sat: 78,  bright: 60  },  // Indigo-Velvet
  { hue: 114, sat: 65,  bright: 55  },  // Forest-Green
  { hue: 198, sat: 61,  bright: 92  },  // Sky-Surge
  { hue: 359, sat: 81,  bright: 93  },  // Racing-Red
  { hue: 46,  sat: 92,  bright: 100 },  // Bright-Amber
];

export const NUM_COLORS = 5;

export function getRandomPaletteColor(): { hue: number; sat: number; bright: number } {
  const index = Math.floor(Math.random() * NUM_COLORS);
  return { ...PALETTE[index] };
}

export function getPaletteColor(index: number): { hue: number; sat: number; bright: number } {
  const clampedIndex = Math.max(0, Math.min(NUM_COLORS - 1, index));
  return { ...PALETTE[clampedIndex] };
}

export function mapCCToPaletteIndex(ccValue: number): number {
  return Math.floor(ccValue / (127 / NUM_COLORS));
}