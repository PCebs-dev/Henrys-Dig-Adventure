/** Crystal frame indices — see `treasure/crystalFrames.js` for crop rects. */
export const CRYSTAL_TYPES = [
  { key: 'crystal_sky', frame: 0, label: 'Sky Crystal', points: 10, color: 0x38bdf8 },
  { key: 'crystal_violet', frame: 1, label: 'Violet Crystal', points: 12, color: 0xa855f7 },
  { key: 'crystal_emerald', frame: 2, label: 'Emerald Crystal', points: 14, color: 0x22c55e },
  { key: 'crystal_amethyst', frame: 3, label: 'Amethyst Crystal', points: 16, color: 0xc084fc },
  { key: 'crystal_amber', frame: 4, label: 'Amber Crystal', points: 18, color: 0xf59e0b },
  { key: 'crystal_sapphire', frame: 5, label: 'Sapphire Crystal', points: 20, color: 0x3b82f6 },
  { key: 'crystal_ruby', frame: 6, label: 'Ruby Crystal', points: 22, color: 0xef4444 },
]

export function rollOutcome(rand) {
  const r = rand()
  if (r < 0.58) return { type: 'empty' }
  if (r < 0.82) return { type: 'gem' }
  if (r < 0.96) return { type: 'chest' }
  return { type: 'rare' }
}

export function rollCrystal(rand) {
  const idx = Math.floor(rand() * CRYSTAL_TYPES.length)
  return CRYSTAL_TYPES[Math.max(0, Math.min(CRYSTAL_TYPES.length - 1, idx))]
}

export function rollChest(rand) {
  const itemCount = 1 + Math.floor(rand() * 4) // 1..4 gems per chest
  const items = []
  for (let i = 0; i < itemCount; i++) items.push(rollCrystal(rand))

  const hasExtraDig = rand() < 0.12
  return { items, hasExtraDig }
}
