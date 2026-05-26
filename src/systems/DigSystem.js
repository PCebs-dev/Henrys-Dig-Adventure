import { seededRng } from './seededRng.js'
import { rollOutcome, rollCrystal, rollChest } from './LootTables.js'

export class DigSystem {
  constructor({ tileSize = 32 } = {}) {
    this.tileSize = tileSize
    this.spots = new Map() // key -> { digCount }
  }

  keyForWorld(x, y) {
    const tx = Math.floor(x / this.tileSize)
    const ty = Math.floor(y / this.tileSize)
    return `${tx},${ty}`
  }

  getSpot(key) {
    const existing = this.spots.get(key)
    if (existing) return existing
    const spot = { digCount: 0 }
    this.spots.set(key, spot)
    return spot
  }

  digAt({ x, y, worldId = 'forest' }) {
    const key = this.keyForWorld(x, y)
    const spot = this.getSpot(key)
    spot.digCount += 1

    const rand = seededRng(`${worldId}:${key}`)
    const outcome = rollOutcome(rand)

    return {
      key,
      digCount: spot.digCount,
      outcome,
      rollCrystal: () => rollCrystal(rand),
      rollChest: () => rollChest(rand),
    }
  }
}

