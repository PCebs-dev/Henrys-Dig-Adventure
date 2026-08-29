import sharkImg from '../assets/boat/shark.png'
import fishImg from '../assets/boat/fish.png'

export const SHARK_KEY = 'boat-shark'
export const FISH_KEY = 'boat-fish'

export function preloadBoatAssets(scene) {
  if (scene.textures.exists(SHARK_KEY)) return
  scene.load.image(SHARK_KEY, sharkImg)
  scene.load.image(FISH_KEY, fishImg)
}

export function ensureBoatAssetsLoaded(scene) {
  if (scene.textures.exists(SHARK_KEY)) return true
  if (!scene.load.isLoading()) {
    preloadBoatAssets(scene)
    scene.load.start()
  }
  return false
}
