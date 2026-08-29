import { rollChest } from '../systems/LootTables.js'
import { pickChestIconFrame } from '../treasure/treasureIconFrames.js'

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildReachable(walkGrid, cols, rows, startCol, startRow) {
  const reach = new Set()
  const stack = [{ c: startCol, r: startRow }]
  while (stack.length) {
    const { c, r } = stack.pop()
    const key = `${c},${r}`
    if (reach.has(key)) continue
    if (c < 0 || r < 0 || c >= cols || r >= rows) continue
    if (!walkGrid[r][c]) continue
    reach.add(key)
    stack.push({ c: c + 1, r }, { c: c - 1, r }, { c, r: r + 1 }, { c, r: r - 1 })
  }
  return reach
}

function isFarFrom(points, col, row, minDist) {
  return points.every((p) => Math.hypot(p.col - col, p.row - row) >= minDist)
}

/**
 * Place visible surface gems and hidden buried-chest dig spots.
 * Chests only appear at buried spots (after digging deep enough) or map chests — not random digs.
 */
export function placeDigSites({
  walkGrid,
  cols,
  rows,
  rand,
  seed,
  spawnCol,
  spawnRow,
  reservedTiles = new Set(),
  surfaceGemCount = 8,
  buriedChestCount = 2,
}) {
  const reachable = buildReachable(walkGrid, cols, rows, spawnCol, spawnRow)
  const surfaceGems = []
  const buriedChests = []
  const used = new Set(reservedTiles)

  for (let attempt = 0; attempt < 300 && surfaceGems.length < surfaceGemCount; attempt++) {
    const col = 2 + Math.floor(rand() * (cols - 4))
    const row = 2 + Math.floor(rand() * (rows - 4))
    const key = `${col},${row}`

    if (!reachable.has(key) || used.has(key)) continue
    if (Math.hypot(col - spawnCol, row - spawnRow) < 6) continue
    if (!isFarFrom(surfaceGems, col, row, 5)) continue

    surfaceGems.push({
      col,
      row,
      frame: Math.floor(rand() * 7),
      tier: 'surface',
    })
    used.add(key)
  }

  const lootRand = mulberry32((seed + 4400) >>> 0)
  for (let attempt = 0; attempt < 250 && buriedChests.length < buriedChestCount; attempt++) {
    const col = 2 + Math.floor(rand() * (cols - 4))
    const row = 2 + Math.floor(rand() * (rows - 4))
    const key = `${col},${row}`

    if (!reachable.has(key) || used.has(key)) continue
    if (Math.hypot(col - spawnCol, row - spawnRow) < 10) continue
    if (!isFarFrom(buriedChests, col, row, 8)) continue
    if (!isFarFrom(surfaceGems, col, row, 4)) continue

    buriedChests.push({
      col,
      row,
      requiredDepth: 2,
      iconFrame: pickChestIconFrame(rand),
      loot: rollChest(lootRand),
    })
    used.add(key)
  }

  return { surfaceGems, buriedChests }
}
