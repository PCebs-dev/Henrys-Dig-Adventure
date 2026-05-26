import { CAVE_TILE } from '../mapAssets.js'
import { placeMapChests } from '../placeMapChests.js'

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CAVE_WALKABLE_RATIO = 0.78

export function generateCaveWorld(seed = Date.now()) {
  const rand = mulberry32((seed + 999) >>> 0)
  const cols = 30
  const rows = 20
  const tileSize = 64

  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: CAVE_TILE.WALL_DARK })),
  )

  const rooms = []
  const roomTarget = 3 + Math.floor(rand() * 2)
  let attempts = 0
  while (rooms.length < roomTarget && attempts < 200) {
    attempts++
    const w = 8 + Math.floor(rand() * 6)
    const h = 7 + Math.floor(rand() * 5)
    const x = 1 + Math.floor(rand() * (cols - w - 2))
    const y = 1 + Math.floor(rand() * (rows - h - 2))
    const room = { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) }
    if (rooms.some((r) => overlaps(r, room))) continue
    rooms.push(room)
    carveRoom(grid, room)
  }

  connectAllRooms(grid, cols, rows, rooms, rand)
  widenPaths(grid, cols, rows, 5)
  expandWalkableCave(grid, cols, rows, CAVE_WALKABLE_RATIO)
  polishWalls(grid, cols, rows)
  scatterProps(grid, cols, rows, rand)

  const oreBonus = new Set()
  placeOres(grid, cols, rows, rand, oreBonus)

  const spawnCol = Math.floor(cols / 2)
  const spawnRow = rows - 3
  clearArea(grid, spawnCol, spawnRow, 3, CAVE_TILE.DIRT)

  ensureCaveConnectivity(grid, cols, rows, spawnCol, spawnRow)

  const walkGrid = grid.map((row) => row.map((cell) => isWalkable(cell.type)))
  const chests = placeMapChests({
    walkGrid,
    cols,
    rows,
    rand,
    seed: (seed + 5000) >>> 0,
    spawnCol,
    spawnRow,
    count: 2 + Math.floor(rand() * 2),
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
  }
}

function isWalkable(type) {
  return (
    type === CAVE_TILE.DIRT ||
    type === CAVE_TILE.ORE_EMERALD ||
    type === CAVE_TILE.ORE_RUBY ||
    type === CAVE_TILE.ORE_SAPPHIRE ||
    type === CAVE_TILE.BOXED ||
    type === CAVE_TILE.BOXED_LIGHT
  )
}

function countWalkable(grid, cols, rows) {
  let n = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isWalkable(grid[r][c].type)) n++
    }
  }
  return n
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function carveRoom(grid, { x, y, w, h }) {
  for (let r = y; r < y + h; r++) {
    for (let c = x; c < x + w; c++) {
      grid[r][c] = { type: CAVE_TILE.DIRT }
    }
  }
}

function connectAllRooms(grid, cols, rows, rooms, rand) {
  if (rooms.length < 2) return

  const linked = [rooms[0]]
  const pending = rooms.slice(1)

  while (pending.length) {
    let bestA = null
    let bestB = null
    let bestDist = Infinity

    for (const a of linked) {
      for (const b of pending) {
        const d = Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy)
        if (d < bestDist) {
          bestDist = d
          bestA = a
          bestB = b
        }
      }
    }

    connectWide(grid, cols, rows, bestA, bestB)
    linked.push(bestB)
    pending.splice(pending.indexOf(bestB), 1)
  }

  const extraLinks = 1 + Math.floor(rand() * 2)
  for (let i = 0; i < extraLinks; i++) {
    const a = rooms[Math.floor(rand() * rooms.length)]
    const b = rooms[Math.floor(rand() * rooms.length)]
    if (a !== b) connectWide(grid, cols, rows, a, b)
  }
}

function connectWide(grid, cols, rows, a, b) {
  let x = a.cx
  let y = a.cy
  const carve = (cx, cy) => setDirtWide(grid, cols, rows, cx, cy)

  while (x !== b.cx) {
    carve(x, y)
    x += x < b.cx ? 1 : -1
  }
  while (y !== b.cy) {
    carve(x, y)
    y += y < b.cy ? 1 : -1
  }
  carve(x, y)
}

function setDirtWide(grid, cols, rows, c, r) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nc = c + dc
      const nr = r + dr
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue
      if (grid[nr][nc].type === CAVE_TILE.WALL_DARK) {
        grid[nr][nc] = { type: CAVE_TILE.DIRT }
      }
    }
  }
}

function widenPaths(grid, cols, rows, passes = 2) {
  for (let pass = 0; pass < passes; pass++) {
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c].type !== CAVE_TILE.WALL_DARK) continue
        const left = grid[r][c - 1].type === CAVE_TILE.DIRT
        const right = grid[r][c + 1].type === CAVE_TILE.DIRT
        const up = grid[r - 1][c].type === CAVE_TILE.DIRT
        const down = grid[r + 1][c].type === CAVE_TILE.DIRT
        if ((left && right) || (up && down)) {
          grid[r][c] = { type: CAVE_TILE.DIRT }
        }
      }
    }
  }
}

/** Grow floor until ~78% of the cave is walkable */
function expandWalkableCave(grid, cols, rows, minRatio) {
  const total = cols * rows
  const target = Math.floor(total * minRatio)
  let guard = 0

  while (countWalkable(grid, cols, rows) < target && guard < total * 6) {
    guard++
    let changed = false
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c].type !== CAVE_TILE.WALL_DARK) continue
        const nearFloor = neighbors(grid, cols, rows, c, r).some((t) => isWalkable(t))
        if (nearFloor) {
          grid[r][c] = { type: CAVE_TILE.DIRT }
          changed = true
          if (countWalkable(grid, cols, rows) >= target) return
        }
      }
    }
    if (!changed) break
  }
}

function polishWalls(grid, cols, rows) {
  const copy = grid.map((row) => row.map((c) => ({ ...c })))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (copy[r][c].type !== CAVE_TILE.DIRT) continue
      const wallDarkNeighbors = neighbors(copy, cols, rows, c, r).filter(
        (t) => t === CAVE_TILE.WALL_DARK,
      ).length
      if (wallDarkNeighbors >= 4) {
        grid[r][c] = { type: CAVE_TILE.WALL }
      }
    }
  }
}

function neighbors(grid, cols, rows, c, r) {
  const types = []
  for (const [dc, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nc = c + dc
    const nr = r + dr
    if (nc >= 0 && nr >= 0 && nc < cols && nr < rows) types.push(grid[nr][nc].type)
  }
  return types
}

function scatterProps(grid, cols, rows, rand) {
  const count = 1 + Math.floor(rand() * 2)
  let placed = 0
  let tries = 0
  while (placed < count && tries < 60) {
    tries++
    const c = Math.floor(rand() * cols)
    const r = Math.floor(rand() * rows)
    if (grid[r][c].type !== CAVE_TILE.DIRT) continue
    const walkNeighbors = neighbors(grid, cols, rows, c, r).filter((t) => t === CAVE_TILE.DIRT).length
    if (walkNeighbors < 4) continue
    grid[r][c] = {
      type: rand() > 0.5 ? CAVE_TILE.BOXED : CAVE_TILE.BOXED_LIGHT,
    }
    placed++
  }
}

function placeOres(grid, cols, rows, rand, oreBonus) {
  const ores = [CAVE_TILE.ORE_EMERALD, CAVE_TILE.ORE_RUBY, CAVE_TILE.ORE_SAPPHIRE]
  let placed = 0
  for (let r = 1; r < rows - 1 && placed < 4; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c].type !== CAVE_TILE.DIRT) continue
      const walkNeighbors = neighbors(grid, cols, rows, c, r).filter((t) => t === CAVE_TILE.DIRT).length
      if (walkNeighbors <= 1 && rand() < 0.28) {
        grid[r][c] = { type: ores[Math.floor(rand() * ores.length)] }
        oreBonus.add(`${c},${r}`)
        placed++
      }
    }
  }
}

function clearArea(grid, cx, cy, radius, type) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (grid[y]?.[x]) grid[y][x] = { type }
    }
  }
}

function ensureCaveConnectivity(grid, cols, rows, sc, sr) {
  let visited = floodFill(grid, cols, rows, sc, sr)
  let walkable = countWalkable(grid, cols, rows)

  let guard = 0
  while (visited.size / walkable < 0.9 && guard < 400) {
    guard++
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].type !== CAVE_TILE.WALL_DARK) continue
        const nearVisited = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dc, dr]) => visited.has(`${c + dc},${r + dr}`))
        if (nearVisited) {
          grid[r][c] = { type: CAVE_TILE.DIRT }
        }
      }
    }
    visited = floodFill(grid, cols, rows, sc, sr)
    walkable = countWalkable(grid, cols, rows)
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
    if (!isWalkable(grid[r][c].type)) continue
    seen.add(k)
    stack.push({ c: c + 1, r }, { c: c - 1, r }, { c, r: r + 1 }, { c, r: r - 1 })
  }
  return seen
}
