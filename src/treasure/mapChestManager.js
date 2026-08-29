import { playTreasureReveal } from './treasureReveal.js'
import {
  TREASURE_ICONS_KEY,
  treasureDisplayScale,
  registerTreasureIconFrames,
} from './treasureIconFrames.js'

export class MapChestManager {
  constructor(scene, { chests, tileSize }) {
    this.scene = scene
    this.tileSize = tileSize
    this.openRadius = tileSize + 12
    this.entries = []
    this.zones = scene.physics.add.group()
    this.opening = false

    registerTreasureIconFrames(scene)

    for (const chest of chests) {
      if (chest.opened) continue
      this._spawnChest(chest)
    }

    scene.physics.add.overlap(
      scene.player,
      this.zones,
      (_player, zone) => this._tryOpenZone(zone),
      undefined,
      scene,
    )
  }

  _spawnChest(chest) {
    const { scene } = this
    const x = chest.col * this.tileSize + this.tileSize / 2
    const y = chest.row * this.tileSize + this.tileSize / 2
    const frame = chest.iconFrame ?? 0
    const scale = treasureDisplayScale(this.tileSize)

    const sprite = scene.add
      .sprite(x, y, TREASURE_ICONS_KEY, frame)
      .setOrigin(0.5, 0.85)
      .setScale(scale)
      .setDepth(y + 12)

    scene.tweens.add({
      targets: sprite,
      y: y - 5,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const glow = scene.add
      .circle(x, y + 4, 18, 0xfbbf24, 0.15)
      .setDepth(y + 11)
    scene.tweens.add({
      targets: glow,
      alpha: 0.3,
      scale: 1.15,
      duration: 900,
      yoyo: true,
      repeat: -1,
    })

    const zoneSize = Math.max(44, Math.round(this.tileSize * 0.85))
    const zone = scene.add.zone(x, y, zoneSize, zoneSize)
    scene.physics.add.existing(zone)
    zone.body.setAllowGravity(false)
    zone.body.setImmovable(true)
    zone.chest = chest

    this.zones.add(zone)
    this.entries.push({ chest, sprite, glow, zone })
  }

  findChestNear(worldX, worldY, maxTiles = 1.2) {
    const col = Math.floor(worldX / this.tileSize)
    const row = Math.floor(worldY / this.tileSize)

    let best = null
    let bestDist = maxTiles

    for (const entry of this.entries) {
      if (entry.chest.opened) continue
      const d = Math.hypot(entry.chest.col - col, entry.chest.row - row)
      if (d < bestDist) {
        bestDist = d
        best = entry
      }
    }
    return best
  }

  getApproachTile(entry, fromWorldX, fromWorldY) {
    const { col, row } = entry.chest
    const candidates = [
      { col: col + 1, row },
      { col: col - 1, row },
      { col, row: row + 1 },
      { col, row: row - 1 },
    ].filter(({ col: c, row: r }) => this.scene.map.walkGrid[r]?.[c])

    if (candidates.length === 0) return null

    let best = candidates[0]
    let bestDist = Infinity
    for (const t of candidates) {
      const wx = t.col * this.tileSize + this.tileSize / 2
      const wy = t.row * this.tileSize + this.tileSize / 2
      const d = Math.hypot(wx - fromWorldX, wy - fromWorldY)
      if (d < bestDist) {
        bestDist = d
        best = t
      }
    }
    return {
      col: best.col,
      row: best.row,
      x: best.col * this.tileSize + this.tileSize / 2,
      y: best.row * this.tileSize + this.tileSize / 2,
    }
  }

  isPlayerInRange(entry) {
    const { col, row } = entry.chest
    const playerCol = Math.floor(this.scene.player.x / this.tileSize)
    const playerRow = Math.floor(this.scene.player.y / this.tileSize)
    const tileDist = Math.max(Math.abs(playerCol - col), Math.abs(playerRow - row))
    if (tileDist <= 1) return true

    const cx = col * this.tileSize + this.tileSize / 2
    const cy = row * this.tileSize + this.tileSize / 2
    const px = this.scene.player.x
    const py = this.scene.player.y
    return Math.hypot(px - cx, py - cy) <= this.openRadius
  }

  async tryOpenEntry(entry) {
    if (!entry || entry.chest.opened) return false
    if (this.scene.revealActive || this.scene.isDigging) return false
    if (!this.isPlayerInRange(entry)) return false
    return this._openChest(entry)
  }

  async _tryOpenZone(zone) {
    const entry = this.entries.find((e) => e.zone === zone)
    if (!entry) return
    await this._openChest(entry)
  }

  async _openChest(entry) {
    const { scene } = this
    if (this.opening || entry.chest.opened || scene.revealActive || scene.isDigging) return false

    this.opening = true
    entry.chest.opened = true
    entry.sprite.destroy()
    entry.glow.destroy()
    entry.zone.destroy()
    this.entries = this.entries.filter((e) => e !== entry)

    scene.waypoints = []
    scene.pendingDig = null
    scene.pendingChest = null
    scene.player.body.setVelocity(0, 0)

    await playTreasureReveal(scene, {
      chest: entry.chest.loot,
      iconFrame: entry.chest.iconFrame ?? 0,
      sfx: scene.sfx,
      state: scene.state,
    })
    this.opening = false
    return true
  }

  destroy() {
    for (const entry of this.entries) {
      entry.sprite?.destroy()
      entry.glow?.destroy()
      entry.zone?.destroy()
    }
    this.entries = []
    this.zones?.clear(true, true)
  }
}
