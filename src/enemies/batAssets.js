// Bat sprites: src/assets/Sprites/bat/
// Each fly-*.png is a horizontal strip (e.g. 96x32 = 3 frames @ 32px).
// Animate frames inside ONE sheet; flip the sprite for left/right flight.

const flatBatPng = import.meta.glob('../assets/**/bat/*.png', {
  eager: true,
  import: 'default',
})
const nestedBatPng = import.meta.glob('../assets/**/bat/**/*.png', {
  eager: true,
  import: 'default',
})
const flatBatPngUpper = import.meta.glob('../assets/**/Bat/*.png', {
  eager: true,
  import: 'default',
})
const nestedBatPngUpper = import.meta.glob('../assets/**/Bat/**/*.png', {
  eager: true,
  import: 'default',
})

const ALL_BAT_FILES = {
  ...flatBatPng,
  ...nestedBatPng,
  ...flatBatPngUpper,
  ...nestedBatPngUpper,
}

const FLY_ANIM_KEY = 'bat-fly'
const FLY_TEXTURE_PREFIX = 'bat-fly'
const FRAME_W = 32
const FRAME_H = 32

const FLY_SHEET_PRIORITY = [
  /fly-front/i,
  /fly-back/i,
  /fly-right/i,
  /fly-left/i,
  /fly-persp-right/i,
  /fly-persp-left/i,
  /fly/i,
]

function isFlySheetPath(path) {
  const n = path.replace(/\\/g, '/').toLowerCase()
  if (/death|die|dead|hurt|hit|idle/i.test(n)) return false
  return /fly|flap|glide/i.test(n)
}

function pickFlySheet() {
  const flyFiles = Object.entries(ALL_BAT_FILES).filter(([path]) => isFlySheetPath(path))
  if (flyFiles.length === 0) return null

  for (const pattern of FLY_SHEET_PRIORITY) {
    const match = flyFiles.find(([path]) => pattern.test(path))
    if (match) return match
  }

  return flyFiles[0]
}

const FLY_SHEET = pickFlySheet()

export function getBatFrameCount() {
  return FLY_SHEET ? 3 : 0
}

export function hasBatArt() {
  return FLY_SHEET !== null
}

export function preloadBatAssets(scene) {
  if (!FLY_SHEET) return

  const [, url] = FLY_SHEET
  scene.load.spritesheet(FLY_TEXTURE_PREFIX, url, {
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
  })
}

export function createBatAnimations(scene) {
  if (scene.anims.exists(FLY_ANIM_KEY)) {
    scene.anims.remove(FLY_ANIM_KEY)
  }

  if (!scene.textures.exists(FLY_TEXTURE_PREFIX)) return false

  const texture = scene.textures.get(FLY_TEXTURE_PREFIX)
  const frameCount = texture.frameTotal
  if (frameCount < 1) return false

  scene.anims.create({
    key: FLY_ANIM_KEY,
    frames: scene.anims.generateFrameNumbers(FLY_TEXTURE_PREFIX, {
      start: 0,
      end: frameCount - 1,
    }),
    frameRate: 10,
    repeat: -1,
  })
  return true
}

export function getBatSpriteKey() {
  return FLY_SHEET ? FLY_TEXTURE_PREFIX : 'bat'
}

export function getBatAnimKey() {
  return FLY_ANIM_KEY
}
