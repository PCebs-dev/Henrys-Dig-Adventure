/**
 * Manual frame rects for `Crystals.png` (128×64).
 * The sheet is not a uniform grid — 4 gems on top, 3 offset on the bottom.
 */
export const CRYSTAL_FRAMES = [
  { x: 1, y: 5, width: 30, height: 22 },
  { x: 37, y: 3, width: 22, height: 26 },
  { x: 70, y: 3, width: 20, height: 26 },
  { x: 101, y: 5, width: 22, height: 22 },
  { x: 20, y: 37, width: 24, height: 24 },
  { x: 50, y: 35, width: 28, height: 28 },
  { x: 87, y: 35, width: 18, height: 27 },
]

const TEXTURE_KEY = 'crystals'

export function preloadCrystalTexture(scene, url) {
  scene.load.image(TEXTURE_KEY, url)
}

export function registerCrystalFrames(scene) {
  if (!scene.textures.exists(TEXTURE_KEY)) return
  const texture = scene.textures.get(TEXTURE_KEY)
  if (!texture || texture.customCrystalFrames) return

  CRYSTAL_FRAMES.forEach((rect, index) => {
    if (!texture.has(String(index))) {
      texture.add(index, 0, rect.x, rect.y, rect.width, rect.height)
    }
  })
  texture.customCrystalFrames = true
}

export function createCrystalSprite(scene, x, y, frame, displaySize = 56) {
  registerCrystalFrames(scene)
  return scene.add
    .sprite(x, y, TEXTURE_KEY, frame)
    .setOrigin(0.5, 0.5)
    .setDisplaySize(displaySize, displaySize)
}
