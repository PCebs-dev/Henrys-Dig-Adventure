export function findPath(walkGrid, start, end) {
  const rows = walkGrid.length
  const cols = walkGrid[0]?.length ?? 0
  if (!cols || !inBounds(start, cols, rows) || !inBounds(end, cols, rows)) return []
  if (!walkGrid[end.row][end.col]) {
    end = nearestWalkable(walkGrid, end, cols, rows)
    if (!end) return []
  }
  if (!walkGrid[start.row][start.col]) return []

  const open = [{ ...start, g: 0, f: heuristic(start, end) }]
  const cameFrom = new Map()
  const gScore = new Map([[cellKey(start), 0]])

  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]

  while (open.length) {
    open.sort((a, b) => a.f - b.f)
    const current = open.shift()
    if (current.col === end.col && current.row === end.row) {
      return reconstruct(cameFrom, current)
    }

    for (const [dc, dr] of dirs) {
      const nc = current.col + dc
      const nr = current.row + dr
      if (!inBounds({ col: nc, row: nr }, cols, rows)) continue
      if (!walkGrid[nr][nc]) continue

      const tentative = (gScore.get(cellKey(current)) ?? Infinity) + 1
      const nk = cellKey({ col: nc, row: nr })
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, current)
        gScore.set(nk, tentative)
        const f = tentative + heuristic({ col: nc, row: nr }, end)
        if (!open.some((n) => n.col === nc && n.row === nr)) {
          open.push({ col: nc, row: nr, g: tentative, f })
        }
      }
    }
  }

  return []
}

function reconstruct(cameFrom, current) {
  const path = [{ col: current.col, row: current.row }]
  let k = cellKey(current)
  while (cameFrom.has(k)) {
    current = cameFrom.get(k)
    path.unshift({ col: current.col, row: current.row })
    k = cellKey(current)
  }
  return path
}

function heuristic(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row)
}

function cellKey({ col, row }) {
  return `${col},${row}`
}

function inBounds({ col, row }, cols, rows) {
  return col >= 0 && row >= 0 && col < cols && row < rows
}

function nearestWalkable(grid, target, cols, rows) {
  const maxR = Math.max(cols, rows)
  for (let r = 1; r <= maxR; r++) {
    for (let dr = -r; dr <= r; dr++) {
      for (let dc = -r; dc <= r; dc++) {
        const c = target.col + dc
        const row = target.row + dr
        if (inBounds({ col: c, row }, cols, rows) && grid[row][c]) {
          return { col: c, row }
        }
      }
    }
  }
  return null
}

export function pathToWorldWaypoints(path, tileSize) {
  return path.map(({ col, row }) => ({
    x: col * tileSize + tileSize / 2,
    y: row * tileSize + tileSize / 2,
  }))
}

export function worldToCell(x, y, tileSize) {
  return {
    col: Math.floor(x / tileSize),
    row: Math.floor(y / tileSize),
  }
}
