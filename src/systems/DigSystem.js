import { seededRng } from './seededRng.js'
import { rollOutcomeForDepth, rollCrystalForTier } from './LootTables.js'

export class DigSystem {
  constructor({ tileSize = 32, surfaceGems = [], buriedChests = [] } = {}) {
    this.tileSize = tileSize
    this.spots = new Map()
    this.surfaceGems = new Map(surfaceGems.map((g) => [`${g.col},${g.row}`, g]))
    this.buriedChests = new Map(
      buriedChests.map((c) => [`${c.col},${c.row}`, c]),
    )
    this.claimedSurfaceGems = new Set()
    this.claimedBuriedChests = new Set()
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

  hasSurfaceGem(key) {
    return this.surfaceGems.has(key) && !this.claimedSurfaceGems.has(key)
  }

  digAt({ x, y, worldId = 'top' }) {
    const key = this.keyForWorld(x, y)
    const spot = this.getSpot(key)
    spot.digCount += 1
    const depth = spot.digCount

    const rand = seededRng(`${worldId}:${key}`)
    const surfaceGem = this.surfaceGems.get(key)
    const buriedChest = this.buriedChests.get(key)

    if (surfaceGem && depth === 1 && !this.claimedSurfaceGems.has(key)) {
      this.claimedSurfaceGems.add(key)
      const crystal = rollCrystalForTier(rand, surfaceGem.tier ?? 'surface')
      return {
        key,
        digCount: depth,
        outcome: { type: 'gem', tier: 'surface' },
        crystal,
        surfaceGemClaimed: true,
      }
    }

    if (
      buriedChest &&
      depth >= buriedChest.requiredDepth &&
      !this.claimedBuriedChests.has(key)
    ) {
      this.claimedBuriedChests.add(key)
      return {
        key,
        digCount: depth,
        outcome: { type: 'buried_chest' },
        chest: buriedChest.loot,
        iconFrame: buriedChest.iconFrame ?? 0,
      }
    }

    const outcome = rollOutcomeForDepth(rand, depth, worldId)
    return {
      key,
      digCount: depth,
      outcome,
      rollCrystal: () => rollCrystalForTier(rand, outcome.tier ?? 'shallow'),
    }
  }
}
