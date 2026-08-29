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

const TIER_FRAMES = {
  surface: [0, 1, 2],
  shallow: [0, 1, 2],
  medium: [2, 3, 4],
  deep: [4, 5, 6],
  cave_shallow: [1, 2, 3],
  cave_deep: [5, 6],
}

/** Random digs never spawn chests — chests live at map/buried spots only. */
export function rollOutcomeForDepth(rand, depth, worldId = 'top') {
  const isCave = worldId === 'cave'

  if (depth === 1) {
    const emptyChance = isCave ? 0.62 : 0.78
    if (rand() < emptyChance) return { type: 'empty' }
    return { type: 'gem', tier: isCave ? 'cave_shallow' : 'shallow' }
  }

  if (depth === 2) {
    if (rand() < 0.38) return { type: 'empty' }
    if (rand() < 0.82) return { type: 'gem', tier: isCave ? 'cave_shallow' : 'medium' }
    return { type: 'gem', tier: isCave ? 'cave_deep' : 'deep' }
  }

  // depth 3+
  if (rand() < 0.22) return { type: 'empty' }
  return { type: 'gem', tier: isCave ? 'cave_deep' : 'deep' }
}

export function rollCrystalForTier(rand, tier = 'shallow') {
  const frames = TIER_FRAMES[tier] ?? TIER_FRAMES.shallow
  const frame = frames[Math.floor(rand() * frames.length)]
  return CRYSTAL_TYPES.find((c) => c.frame === frame) ?? CRYSTAL_TYPES[0]
}

export function rollCrystal(rand) {
  return rollCrystalForTier(rand, 'medium')
}

export function rollChest(rand) {
  const itemCount = 1 + Math.floor(rand() * 4)
  const items = []
  for (let i = 0; i < itemCount; i++) items.push(rollCrystalForTier(rand, 'deep'))

  const hasExtraDig = rand() < 0.12
  return { items, hasExtraDig }
}

/** @deprecated Use rollOutcomeForDepth — kept so old imports don't break. */
export function rollOutcome(rand) {
  return rollOutcomeForDepth(rand, 1, 'top')
}
