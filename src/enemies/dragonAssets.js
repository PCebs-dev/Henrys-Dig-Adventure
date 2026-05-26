// Baby Brass Dragon — src/assets/Sprites/Young Brass Dragon/BabyBrassDragon.png
// Horizontal strip: 64x16 = 4 frames @ 16x16.

import dragonSheet from '../assets/Sprites/Young Brass Dragon/BabyBrassDragon.png'

const MOVE_ANIM_KEY = 'dragon-move'
const MOVE_TEXTURE_KEY = 'dragon-move'
const FRAME_W = 16
const FRAME_H = 16

export function hasDragonArt() {
  return true
}

export function preloadDragonAssets(scene) {
  scene.load.spritesheet(MOVE_TEXTURE_KEY, dragonSheet, {
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
  })
}

export function createDragonAnimations(scene) {
  if (scene.anims.exists(MOVE_ANIM_KEY)) {
    scene.anims.remove(MOVE_ANIM_KEY)
  }

  if (!scene.textures.exists(MOVE_TEXTURE_KEY)) return false

  const texture = scene.textures.get(MOVE_TEXTURE_KEY)
  const frameTotal = texture.frameTotal
  if (frameTotal < 1) return false

  scene.anims.create({
    key: MOVE_ANIM_KEY,
    frames: scene.anims.generateFrameNumbers(MOVE_TEXTURE_KEY, {
      start: 0,
      end: frameTotal - 1,
    }),
    frameRate: 8,
    repeat: -1,
  })
  return true
}

export function getDragonSpriteKey() {
  return MOVE_TEXTURE_KEY
}

export function getDragonAnimKey() {
  return MOVE_ANIM_KEY
}
