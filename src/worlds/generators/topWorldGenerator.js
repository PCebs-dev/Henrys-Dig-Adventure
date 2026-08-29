import { TOP_TILE } from '../mapAssets.js'
import { placeMapChests } from '../placeMapChests.js'
import { placeDigSites } from '../placeDigSites.js'

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WALKABLE_RATIO = 0.8

export function generateTopWorld(seed = Date.now()) {
  const rand = mulberry32(seed >>> 0)
  const cols = 50
  const rows = 38
  const tileSize = 32
  const totalTiles = cols * rows
  const maxBlocked = Math.floor(totalTiles * (1 - WALKABLE_RATIO))
  const obstacleBudget = { maxBlocked, count: () => countBlocked(grid, cols, rows) }

  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => pickWalkableFloor(rand)),
  )

  paintBiomeRegions(grid, cols, rows, rand, TOP_TILE.GRASS, 7 + Math.floor(rand() * 3), 10, 16)
  paintBiomeRegions(grid, cols, rows, rand, TOP_TILE.SAND, 5 + Math.floor(rand() * 2), 9, 14)

  paintWoodGroves(grid, cols, rows, rand)
  paintRockFields(grid, cols, rows, rand, obstacleBudget)
  paintWallSegments(grid, cols, rows, rand, obstacleBudget)
  paintWaterPonds(grid, cols, rows, rand, obstacleBudget)

  enforceWalkableRatio(grid, cols, rows, rand, WALKABLE_RATIO)

  const spawnCol = Math.floor(cols / 2)
  const spawnRow = Math.floor(rows / 2)
  clearArea(grid, spawnCol, spawnRow, 3, TOP_TILE.GRASS)

  ensureConnectivity(grid, cols, rows, spawnCol, spawnRow)

  const walkGrid = grid.map((row) => row.map((cell) => !isBlocked(cell.type)))
  const oreBonus = new Set()
  const chests = placeMapChests({
    walkGrid,
    cols,
    rows,
    rand,
    seed: seed >>> 0,
    spawnCol,
    spawnRow,
    count: 8 + Math.floor(rand() * 5),
  })

  const chestTiles = new Set(chests.map((c) => `${c.col},${c.row}`))
  const { surfaceGems, buriedChests } = placeDigSites({
    walkGrid,
    cols,
    rows,
    rand,
    seed: (seed + 2200) >>> 0,
    spawnCol,
    spawnRow,
    reservedTiles: chestTiles,
    surfaceGemCount: 6 + Math.floor(rand() * 4),
    buriedChestCount: 2 + Math.floor(rand() * 2),
  })

  return {
    cols,
    rows,
    tileSize,
    grid,
    walkGrid,
    spawnCol,
    spawnRow,
    oreBonus,
    chests,
    surfaceGems,
    buriedChests,
  }
}

function isBlocked(type) {
  return type === TOP_TILE.ROCK || type === TOP_TILE.WALL || type === TOP_TILE.WATER
}

function canPlaceDecor(type) {
  return type === TOP_TILE.GRASS || type === TOP_TILE.GROUND || type === TOP_TILE.SAND
}

function isWalkableSurface(type) {
  return (
    type === TOP_TILE.GRASS ||
    type === TOP_TILE.GROUND ||
    type === TOP_TILE.SAND ||
    type === TOP_TILE.WOOD
  )
}

function touchesRock(grid, cols, rows, c, r, radius = 2) {
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (dc === 0 && dr === 0) continue
      const nc = c + dc
      const nr = r + dr
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue
      if (grid[nr][nc].type === TOP_TILE.ROCK) return true
    }
  }
  return false
}

/** Walls only on walkable turf, bordering other walkable tiles — never near rocks */
function canPlaceWallTile(grid, cols, rows, x, y) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return false
  const type = grid[y][x].type
  if (type === TOP_TILE.WATER || type === TOP_TILE.ROCK || type === TOP_TILE.WALL) return false
  if (!isWalkableSurface(type)) return false
  if (touchesRock(grid, cols, rows, x, y, 2)) return false

  let walkableNeighbors = 0
  for (const [dc, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nType = grid[y + dr]?.[x + dc]?.type
    if (isWalkableSurface(nType)) walkableNeighbors++
  }
  return walkableNeighbors >= 1
}

function findWallAnchor(grid, cols, rows, rand) {
  for (let i = 0; i < 50; i++) {
    const c = 2 + Math.floor(rand() * (cols - 4))
    const r = 2 + Math.floor(rand() * (rows - 4))
    if (!canPlaceWallTile(grid, cols, rows, c, r)) continue
    const type = grid[r][c].type
    if (type === TOP_TILE.GRASS || type === TOP_TILE.SAND || type === TOP_TILE.WOOD) {
      return { c, r }
    }
  }
  for (let i = 0; i < 30; i++) {
    const c = 2 + Math.floor(rand() * (cols - 4))
    const r = 2 + Math.floor(rand() * (rows - 4))
    if (canPlaceWallTile(grid, cols, rows, c, r)) return { c, r }
  }
  return null
}

function frameForFloor(type, rand) {
  if (type === TOP_TILE.SAND) return 0
  return Math.floor(rand() * 3)
}

function pickWalkableFloor(rand) {
  const r = rand()
  if (r < 0.42) return { type: TOP_TILE.GRASS, frame: frameForFloor(TOP_TILE.GRASS, rand) }
  if (r < 0.78) return { type: TOP_TILE.SAND, frame: 0 }
  return { type: TOP_TILE.GROUND, frame: frameForFloor(TOP_TILE.GROUND, rand) }
}

function countBlocked(grid, cols, rows) {
  let n = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isBlocked(grid[r][c].type)) n++
    }
  }
  return n
}

function countWalkable(grid, cols, rows) {
  return cols * rows - countBlocked(grid, cols, rows)
}

function canAddBlocked(grid, cols, rows, budget, extra = 1) {
  if (!budget) return true
  return budget.count() + extra <= budget.maxBlocked
}

/** Guarantee at least 80% grass, sand, ground, or wood */
function enforceWalkableRatio(grid, cols, rows, rand, minRatio = WALKABLE_RATIO) {
  const total = cols * rows
  const minWalkable = Math.floor(total * minRatio)
  const floors = [TOP_TILE.GRASS, TOP_TILE.SAND, TOP_TILE.GROUND]

  let guard = 0
  while (countWalkable(grid, cols, rows) < minWalkable && guard < total * 3) {
    guard++
    const c = Math.floor(rand() * cols)
    const r = Math.floor(rand() * rows)
    if (!isBlocked(grid[r][c].type)) continue
    const type = floors[Math.floor(rand() * floors.length)]
    grid[r][c] = { type, frame: frameForFloor(type, rand) }
  }
}

function isFarFrom(centers, cx, cy, minDist) {
  return centers.every((p) => Math.hypot(p.cx - cx, p.cy - cy) >= minDist)
}

/** Large, cohesive patches — one visual frame per patch */
function paintBiomeRegions(grid, cols, rows, rand, type, count, minRadius, maxRadius) {
  for (let i = 0; i < count; i++) {
    const frame = frameForFloor(type, rand)
    paintBiomeBlob(grid, cols, rows, rand, {
      cx: Math.floor(rand() * cols),
      cy: Math.floor(rand() * rows),
      radius: minRadius + Math.floor(rand() * (maxRadius - minRadius + 1)),
      type,
      frame,
    })
  }
}

function paintBiomeBlob(grid, cols, rows, rand, { cx, cy, radius, type, frame }) {
  const useFrame = frame ?? frameForFloor(type, rand)
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue
      const dist = Math.hypot(x - cx, y - cy)
      if (dist > radius + 0.5) continue
      const edge = dist / radius
      const chance = edge < 0.55 ? 1 : 0.92 - edge * 0.35
      if (rand() < chance) {
        grid[y][x] = { type, frame: useFrame }
      }
    }
  }
}

/** Spread-out rock outcrops — kept small to preserve walkable space */
function paintRockFields(grid, cols, rows, rand, budget) {
  const clusterCount = 2 + Math.floor(rand() * 2)
  const centers = []

  for (let i = 0; i < clusterCount; i++) {
    if (!canAddBlocked(grid, cols, rows, budget, 12)) break

    let placed = false
    for (let tryN = 0; tryN < 50; tryN++) {
      const cx = 3 + Math.floor(rand() * (cols - 6))
      const cy = 3 + Math.floor(rand() * (rows - 6))
      if (!isFarFrom(centers, cx, cy, 11)) continue

      const radius = 2 + Math.floor(rand() * 2)
      const frame = Math.floor(rand() * 3)
      paintCluster(grid, cols, rows, rand, {
        cx,
        cy,
        radiusX: radius,
        radiusY: radius + 1,
        type: TOP_TILE.ROCK,
        frame,
        density: 0.82,
        canReplace: canPlaceDecor,
      })
      centers.push({ cx, cy })
      placed = true
      break
    }
    if (!placed) break
  }
}

function paintWallSegments(grid, cols, rows, rand, budget) {
  const wallSegmentCount = 2 + Math.floor(rand() * 2)
  for (let i = 0; i < wallSegmentCount; i++) {
    if (!canAddBlocked(grid, cols, rows, budget, 10)) break
    paintWallSegment(grid, cols, rows, rand)
  }
}

function paintWaterPonds(grid, cols, rows, rand, budget) {
  const pondCount = 1 + Math.floor(rand() * 2)
  for (let i = 0; i < pondCount; i++) {
    if (!canAddBlocked(grid, cols, rows, budget, 14)) break
    paintBlob(grid, cols, rows, rand, {
      cx: Math.floor(rand() * cols),
      cy: Math.floor(rand() * rows),
      radius: 2 + Math.floor(rand() * 1),
      type: TOP_TILE.WATER,
    })
  }
}

/** Bundled wood / log areas */
function paintWoodGroves(grid, cols, rows, rand) {
  const groveCount = 3 + Math.floor(rand() * 3)
  const centers = []

  for (let i = 0; i < groveCount; i++) {
    for (let tryN = 0; tryN < 50; tryN++) {
      const cx = 3 + Math.floor(rand() * (cols - 6))
      const cy = 3 + Math.floor(rand() * (rows - 6))
      if (!isFarFrom(centers, cx, cy, 9)) continue

      const radiusX = 3 + Math.floor(rand() * 3)
      const radiusY = 2 + Math.floor(rand() * 3)
      const frame = Math.floor(rand() * 4)
      paintCluster(grid, cols, rows, rand, {
        cx,
        cy,
        radiusX,
        radiusY,
        type: TOP_TILE.WOOD,
        frame,
        density: 0.9,
        canReplace: (t) => canPlaceDecor(t) && t !== TOP_TILE.ROCK,
      })
      centers.push({ cx, cy })
      break
    }
  }
}

function paintCluster(
  grid,
  cols,
  rows,
  rand,
  { cx, cy, radiusX, radiusY, type, frame, density, canReplace },
) {
  for (let y = cy - radiusY; y <= cy + radiusY; y++) {
    for (let x = cx - radiusX; x <= cx + radiusX; x++) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue
      const nx = (x - cx) / (radiusX + 0.01)
      const ny = (y - cy) / (radiusY + 0.01)
      if (nx * nx + ny * ny > 1.15) continue
      const cell = grid[y][x]
      if (!canReplace(cell.type)) continue
      const edge = nx * nx + ny * ny
      const chance = edge < 0.45 ? density : density - edge * 0.25
      if (rand() < chance) {
        grid[y][x] = { type, frame }
      }
    }
  }
}

function paintBlob(grid, cols, rows, rand, { cx, cy, radius, type }) {
  const frame = frameForFloor(type, rand)
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue
      if (Math.hypot(x - cx, y - cy) <= radius + rand() * 0.8) {
        grid[y][x] = { type, frame }
      }
    }
  }
}

function paintWallSegment(grid, cols, rows, rand) {
  const anchor = findWallAnchor(grid, cols, rows, rand)
  if (!anchor) return

  const horizontal = rand() > 0.5
  const c = anchor.c
  const r = anchor.r
  const length = 4 + Math.floor(rand() * 6)
  const thick = rand() > 0.75 ? 2 : 1
  const frame = Math.floor(rand() * 3)

  const place = (x, y) => {
    if (!canPlaceWallTile(grid, cols, rows, x, y)) return
    grid[y][x] = { type: TOP_TILE.WALL, frame }
  }

  for (let i = 0; i < length; i++) {
    for (let t = 0; t < thick; t++) {
      const x = horizontal ? c + i : c + t
      const y = horizontal ? r + t : r + i
      place(x, y)
    }
  }

  if (rand() > 0.55) {
    const turnLen = 2 + Math.floor(rand() * 4)
    const endC = horizontal ? c + length - 1 : c + thick - 1
    const endR = horizontal ? r + thick - 1 : r + length - 1
    for (let i = 0; i < turnLen; i++) {
      if (horizontal) place(endC, endR + 1 + i)
      else place(endC + 1 + i, endR)
    }
  }
}

function clearArea(grid, cx, cy, radius, type) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (grid[y]?.[x]) grid[y][x] = { type, frame: 0 }
    }
  }
}

function ensureConnectivity(grid, cols, rows, sc, sr) {
  let visited = floodFill(grid, cols, rows, sc, sr)
  let walkable = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isBlocked(grid[r][c].type)) walkable++
    }
  }

  let guard = 0
  while (visited.size / walkable < 0.85 && guard < 500) {
    guard++
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!isBlocked(grid[r][c].type)) continue
        const nearVisited = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dc, dr]) => visited.has(`${c + dc},${r + dr}`))
        if (nearVisited) {
          grid[r][c] = { type: TOP_TILE.GROUND, frame: 0 }
        }
      }
    }
    visited = floodFill(grid, cols, rows, sc, sr)
  }
}

function floodFill(grid, cols, rows, sc, sr) {
  const seen = new Set()
  const stack = [{ c: sc, r: sr }]
  while (stack.length) {
    const { c, r } = stack.pop()
    const k = `${c},${r}`
    if (seen.has(k)) continue
    if (c < 0 || r < 0 || c >= cols || r >= rows) continue
    if (isBlocked(grid[r][c].type)) continue
    seen.add(k)
    stack.push({ c: c + 1, r }, { c: c - 1, r }, { c, r: r + 1 }, { c, r: r - 1 })
  }
  return seen
}
