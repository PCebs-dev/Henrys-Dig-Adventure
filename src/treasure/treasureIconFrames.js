// TreasureIcons.jpg — 10×5 grid on 1024×630
// Each cell: 100×124 with 2px spacing and 1px outer margin.

export const TREASURE_ICONS_KEY = 'treasure-icons'

export const TREASURE_GRID = {
  cols: 10,
  rows: 5,
  marginX: 1,
  marginY: 1,
  spacingX: 2,
  spacingY: 2,
  frameW: 100,
  frameH: 124,
  totalFrames: 50,
}

/** Closed chest frames (pairs + singles from rows 1–3). */
export const CLOSED_CHEST_FRAMES = [
  0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25, 26, 27, 28, 29,
]

export const KEY_FRAMES = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43]

export const LOOT_FRAMES = [44, 45, 46, 47, 48, 49]

export function frameIndex(col, row) {
  return row * TREASURE_GRID.cols + col
}

export function frameRect(index) {
  const { cols, marginX, marginY, spacingX, spacingY, frameW, frameH } = TREASURE_GRID
  const col = index % cols
  const row = Math.floor(index / cols)
  return {
    x: marginX + col * (frameW + spacingX),
    y: marginY + row * (frameH + spacingY),
    width: frameW,
    height: frameH,
  }
}

export function registerTreasureIconFrames(scene) {
  if (!scene.textures.exists(TREASURE_ICONS_KEY)) return false

  const texture = scene.textures.get(TREASURE_ICONS_KEY)
  if (texture.customTreasureFrames) return true

  for (let i = 0; i < TREASURE_GRID.totalFrames; i++) {
    const rect = frameRect(i)
    const key = String(i)
    if (!texture.has(key)) {
      texture.add(key, 0, rect.x, rect.y, rect.width, rect.height)
    }
  }

  texture.customTreasureFrames = true
  return true
}

export function pickChestIconFrame(rand) {
  const idx = Math.floor(rand() * CLOSED_CHEST_FRAMES.length)
  return CLOSED_CHEST_FRAMES[idx]
}

export function getOpenChestFrame(closedFrame) {
  if (closedFrame <= 22 && closedFrame % 2 === 0) {
    return closedFrame + 1
  }
  return 1
}

export function treasureDisplayScale(tileSize) {
  return tileSize <= 32 ? 0.28 : 0.42
}

export function createTreasureIconSprite(scene, x, y, frame, tileSize) {
  registerTreasureIconFrames(scene)
  const scale = treasureDisplayScale(tileSize)
  return scene.add
    .sprite(x, y, TREASURE_ICONS_KEY, frame)
    .setOrigin(0.5, 0.85)
    .setScale(scale)
}
