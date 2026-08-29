import { TOP_TILE } from '../worlds/mapAssets.js'
import { rollCrystalForTier } from '../systems/LootTables.js'

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Flood-fill a connected water pond from the clicked tile. */
export function floodFillWaterPond(grid, cols, rows, startCol, startRow) {
  const tiles = []
  const seen = new Set()
  const stack = [{ col: startCol, row: startRow }]

  while (stack.length) {
    const { col, row } = stack.pop()
    const key = `${col},${row}`
    if (seen.has(key)) continue
    if (col < 0 || row < 0 || col >= cols || row >= rows) continue
    if (grid[row][col].type !== TOP_TILE.WATER) continue

    seen.add(key)
    tiles.push({ col, row })

    stack.push(
      { col: col + 1, row },
      { col: col - 1, row },
      { col, row: row + 1 },
      { col, row: row - 1 },
    )
  }

  return tiles
}

/** Rare underwater crystals hidden in a pond. */
export function placeUnderwaterCrystals(waterTiles, seed = 1) {
  if (waterTiles.length === 0) return []

  const rand = mulberry32(seed >>> 0)
  const count = Math.min(waterTiles.length, 2 + Math.floor(rand() * 4))
  const crystals = []
  const used = new Set()

  for (let attempt = 0; attempt < 80 && crystals.length < count; attempt++) {
    const tile = waterTiles[Math.floor(rand() * waterTiles.length)]
    const key = `${tile.col},${tile.row}`
    if (used.has(key)) continue

    const tier = rand() < 0.35 ? 'deep' : 'medium'
    const crystal = rollCrystalForTier(rand, tier)
    crystals.push({
      col: tile.col,
      row: tile.row,
      frame: crystal.frame,
      key: crystal.key,
      label: crystal.label,
      points: crystal.points + 15,
      tier,
    })
    used.add(key)
  }

  return crystals
}

export function buildWaterWalkGrid(waterTiles, cols, rows) {
  const walkGrid = Array.from({ length: rows }, () => Array(cols).fill(false))
  for (const { col, row } of waterTiles) {
    walkGrid[row][col] = true
  }
  return walkGrid
}
