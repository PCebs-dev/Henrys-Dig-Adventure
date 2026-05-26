import crystalsImg from '../assets/Sprites/Treasure chests/Crystals.png'
import chestLayer1 from '../assets/Sprites/Treasure chests/Layer-1.png'
import chestLayer2 from '../assets/Sprites/Treasure chests/Layer-2.png'
import chestLayer3 from '../assets/Sprites/Treasure chests/Layer-3.png'
import chestLayer4 from '../assets/Sprites/Treasure chests/Layer-4.png'
import chestLayer5 from '../assets/Sprites/Treasure chests/Layer-5.png'
import chestLayer6 from '../assets/Sprites/Treasure chests/Layer-6.png'
import chestLayer7 from '../assets/Sprites/Treasure chests/Layer-7.png'
import chestLayer8 from '../assets/Sprites/Treasure chests/Layer-8.png'
import { preloadCrystalTexture } from './crystalFrames.js'

const CHEST_LAYERS = [
  chestLayer1,
  chestLayer2,
  chestLayer3,
  chestLayer4,
  chestLayer5,
  chestLayer6,
  chestLayer7,
  chestLayer8,
]

export function preloadTreasureAssets(scene) {
  CHEST_LAYERS.forEach((url, i) => {
    scene.load.image(`chest-layer-${i + 1}`, url)
  })
  preloadCrystalTexture(scene, crystalsImg)
}
