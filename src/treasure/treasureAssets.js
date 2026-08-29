import crystalsImg from '../assets/Sprites/Treasure chests/Crystals.png'
import treasureIcons from '../assets/Sprites/Treasure chests/TreasureIcons.jpg'
import { preloadCrystalTexture } from './crystalFrames.js'
import { TREASURE_ICONS_KEY, registerTreasureIconFrames } from './treasureIconFrames.js'

export function preloadTreasureAssets(scene) {
  scene.load.image(TREASURE_ICONS_KEY, treasureIcons)
  preloadCrystalTexture(scene, crystalsImg)
}

export function setupTreasureIcons(scene) {
  registerTreasureIconFrames(scene)
}

export function hasTreasureIcons(scene) {
  return scene.textures.exists(TREASURE_ICONS_KEY)
}

export { registerTreasureIconFrames }
