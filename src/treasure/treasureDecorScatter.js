import {
  TREASURE_ICONS_KEY,
  CLOSED_CHEST_FRAMES,
  KEY_FRAMES,
  LOOT_FRAMES,
  treasureDisplayScale,
  registerTreasureIconFrames,
} from '../treasure/treasureIconFrames.js'

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

/** Decorative treasure icons scattered on the map (visual only). */
export function scatterTreasureDecor(
  scene,
  { walkGrid, cols, rows, tileSize, seed, spawnCol, spawnRow, reservedTiles = new Set(), count = 12 },
) {
  registerTreasureIconFrames(scene)

  const rand = mulberry32((seed + 8800) >>> 0)
  const reachable = buildReachable(walkGrid, cols, rows, spawnCol, spawnRow)
  const decorFrames = [...CLOSED_CHEST_FRAMES, ...KEY_FRAMES, ...LOOT_FRAMES]
  const sprites = []
  const scale = treasureDisplayScale(tileSize) * 0.9
  const used = new Set(reservedTiles)

  for (let attempt = 0; attempt < 400 && sprites.length < count; attempt++) {
    const col = 1 + Math.floor(rand() * (cols - 2))
    const row = 1 + Math.floor(rand() * (rows - 2))
    const key = `${col},${row}`

    if (!reachable.has(key) || used.has(key)) continue
    if (Math.hypot(col - spawnCol, row - spawnRow) < 5) continue

    const x = col * tileSize + tileSize / 2
    const y = row * tileSize + tileSize / 2
    const frame = decorFrames[Math.floor(rand() * decorFrames.length)]

    const sprite = scene.add
      .sprite(x, y, TREASURE_ICONS_KEY, frame)
      .setOrigin(0.5, 0.85)
      .setScale(scale)
      .setAlpha(0.92)
      .setDepth(y + 8)

    scene.tweens.add({
      targets: sprite,
      alpha: 0.7,
      y: y - 3,
      duration: 800 + Math.floor(rand() * 600),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    sprites.push(sprite)
    used.add(key)
  }

  return {
    destroy() {
      for (const sprite of sprites) sprite.destroy()
    },
  }
}
