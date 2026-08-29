import fishImg from '../assets/boat/fish.png'

export const WHALE_KEY = 'boat-whale'
export const FISH_KEY = 'boat-fish'

export function preloadBoatAssets(scene) {
  if (scene.textures.exists(FISH_KEY)) return
  scene.load.image(FISH_KEY, fishImg)
}
