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
    stack.push(
      { c: c + 1, r },
      { c: c - 1, r },
      { c, r: r + 1 },
      { c, r: r - 1 },
    )
  }
  return reach
}

function hasClearPad(walkGrid, cols, rows, col, row, pad = 1) {
  for (let dr = -pad; dr <= pad; dr++) {
    for (let dc = -pad; dc <= pad; dc++) {
      const c = col + dc
      const r = row + dr
      if (c < 0 || r < 0 || c >= cols || r >= rows) return false
      if (!walkGrid[r][c]) return false
    }
  }
  return true
}

/**
 * Place permanent treasure chests on walkable, reachable tiles (not by rocks/walls).
 */
export function placeMapChests({
  walkGrid,
  cols,
  rows,
  rand,
  seed,
  spawnCol,
  spawnRow,
  count = 5,
}) {
  const reachable = buildReachable(walkGrid, cols, rows, spawnCol, spawnRow)
  const chests = []
  const minSpawnDist = 9
  const minBetween = 11

  for (let attempt = 0; attempt < 250 && chests.length < count; attempt++) {
    const col = 2 + Math.floor(rand() * (cols - 4))
    const row = 2 + Math.floor(rand() * (rows - 4))
    const key = `${col},${row}`

    if (!reachable.has(key)) continue
    if (!hasClearPad(walkGrid, cols, rows, col, row, 1)) continue

    if (Math.hypot(col - spawnCol, row - spawnRow) < minSpawnDist) continue

    if (chests.some((c) => Math.hypot(c.col - col, c.row - row) < minBetween)) continue

    const lootRand = mulberry32((seed + chests.length * 9176) >>> 0)
    chests.push({
      id: `chest-${col}-${row}`,
      col,
      row,
      iconFrame: pickChestIconFrame(rand),
      loot: rollChest(lootRand),
      opened: false,
    })
  }

  return chests
}
