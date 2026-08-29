import Phaser from 'phaser'
import { HUD } from '../ui/HUD.js'
import { DigSystem } from '../systems/DigSystem.js'
import { addGem, addScore, consumeDig } from '../gameState.js'
import {
  spawnMiner,
  updateMinerMovementAnimation,
  playMinerDigAnimation,
  playMinerIdleAnimation,
} from '../characters/miner.js'
import { playTreasureReveal, goHomeIfNoDigs } from '../treasure/treasureReveal.js'
import { createCrystalSprite } from '../treasure/crystalFrames.js'
import { generateCaveWorld } from '../worlds/generators/caveWorldGenerator.js'
import { buildCaveWorldMap } from '../worlds/MapBuilder.js'
import { setupClickToMove } from '../movement/clickToMove.js'
import { BatManager } from '../enemies/bat.js'
import { MapChestManager } from '../treasure/mapChestManager.js'
import { spawnSurfaceGemMarkers } from '../worlds/surfaceGemMarkers.js'
import { scatterTreasureDecor } from '../treasure/treasureDecorScatter.js'

export class CaveScene extends Phaser.Scene {
  constructor() {
    super('CaveScene')
  }

  init(data) {
    this.state = data.gameState
    this.sfx = data.sfx
    this.returnScene = data.returnScene ?? 'GameScene'
    this.worldId = 'cave'
    this.mapSeed = data.mapSeed ?? Date.now()
    this.visitDigs = 10
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a0a0a')

    const layout = generateCaveWorld(this.mapSeed)
    this.map = buildCaveWorldMap(this, layout)
    const { worldW, worldH } = this.map

    this.physics.world.setBounds(0, 0, worldW, worldH)

    this.add
      .rectangle(worldW / 2, worldH / 2, worldW, worldH, 0x000000, 0.25)
      .setOrigin(0.5)
      .setDepth(1)

    this.add
      .text(this.scale.width / 2, 18, 'Cave World', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#fde68a',
        backgroundColor: 'rgba(0,0,0,0.45)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(500)

    this.player = spawnMiner(this, this.map.spawnX, this.map.spawnY)
    this.physics.add.collider(this.player, this.map.obstacles)

    this.target = new Phaser.Math.Vector2(this.player.x, this.player.y)
    this.pendingDig = null
    this.isDigging = false
    this.revealActive = false
    this.pendingChest = null

    this.hud = new HUD(this, this.state)
    this.hudHint = 'Dig deeper in the cave for rarer gems. Chests are only in special spots!'
    this.chestManager = new MapChestManager(this, {
      chests: layout.chests ?? [],
      tileSize: this.map.tileSize,
    })
    this.dig = new DigSystem({
      tileSize: this.map.tileSize,
      surfaceGems: layout.surfaceGems ?? [],
      buriedChests: layout.buriedChests ?? [],
    })
    this.surfaceGemMarkers = spawnSurfaceGemMarkers(this, {
      surfaceGems: layout.surfaceGems ?? [],
      tileSize: this.map.tileSize,
    })
    const reservedDecor = new Set([
      ...(layout.chests ?? []).map((c) => `${c.col},${c.row}`),
      ...(layout.surfaceGems ?? []).map((g) => `${g.col},${g.row}`),
      ...(layout.buriedChests ?? []).map((b) => `${b.col},${b.row}`),
    ])
    this.treasureDecor = scatterTreasureDecor(this, {
      walkGrid: layout.walkGrid,
      cols: layout.cols,
      rows: layout.rows,
      tileSize: this.map.tileSize,
      seed: this.mapSeed,
      spawnCol: layout.spawnCol,
      spawnRow: layout.spawnRow,
      reservedTiles: reservedDecor,
      count: 8,
    })
    this.batManager = new BatManager(this)
    setupClickToMove(this, { map: this.map, speed: 190 })

    this.exitText = this.add
      .text(12, this.scale.height - 28, `Cave digs left: ${this.visitDigs}  (Press E to exit)`, {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#fde68a',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    this.input.on('pointerdown', (p) => {
      if (this.revealActive || this.isDigging) return
      this._handleMapClick(p.worldX, p.worldY)
    })

    this.input.keyboard?.on('keydown-E', () => this._exitCave())

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setBounds(0, 0, worldW, worldH)
  }

  _handleMapClick(worldX, worldY) {
    const chestEntry = this.chestManager?.findChestNear(worldX, worldY)
    if (chestEntry) {
      const approach = this.chestManager.getApproachTile(chestEntry, worldX, worldY)
      if (approach) {
        this.pendingChest = chestEntry
        this.setMoveTarget(approach.x, approach.y, null)
        return
      }
    }
    this.pendingChest = null
    this.setMoveTarget(worldX, worldY, { x: worldX, y: worldY })
  }

  _exitCave() {
    if (this.revealActive) return
    this.batManager?.destroy()
    this.chestManager?.destroy()
    this.surfaceGemMarkers?.destroy()
    this.treasureDecor?.destroy()
    this.cameras.main.fadeOut(220, 0, 0, 0)
    this.time.delayedCall(240, () => {
      this.scene.start(this.returnScene, {
        gameState: this.state,
        sfx: this.sfx,
        mapSeed: this.mapSeed,
      })
    })
  }

  _onPlayerDefeated(reason = 'enemies') {
    if (this.revealActive) return
    this.batManager?.destroy()
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(420, () => {
      this.scene.start('HomeScene', {
        gameState: this.state,
        sfx: this.sfx,
        reason,
      })
    })
  }

  shutdown() {
    this.batManager?.destroy()
    this.chestManager?.destroy()
    this.surfaceGemMarkers?.destroy()
    this.treasureDecor?.destroy()
  }

  _startDig(at) {
    if (this.isDigging || this.revealActive) return
    if (this.visitDigs <= 0) {
      this._exitCave()
      return
    }
    if (!this.map.isWalkableAt(at.x, at.y)) {
      this.hud.floatText(at.x, at.y - 18, "Can't dig here!", '#94a3b8')
      return
    }

    if (!consumeDig(this.state)) {
      this.sfx.lowDigs()
      goHomeIfNoDigs(this)
      return
    }

    this.visitDigs -= 1
    this.exitText.setText(`Cave digs left: ${this.visitDigs}  (Press E to exit)`)

    this.isDigging = true
    this.waypoints = []
    this.sfx.digStart()
    playMinerDigAnimation(this.player)

    const ring = this.add.circle(at.x, at.y, 6, 0x000000, 0).setStrokeStyle(2, 0xf59e0b, 1)
    this.tweens.add({
      targets: ring,
      radius: 22,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    })

    this.time.delayedCall(300, () => {
      this._resolveDig(at)
    })
  }

  async _resolveDig(at) {
    const result = this.dig.digAt({ x: at.x, y: at.y, worldId: this.worldId })
    const onOre = this.map.isOreAt(at.x, at.y)

    if (result.outcome.type === 'buried_chest') {
      this.hud.floatText(at.x, at.y - 24, 'Hidden cave chest!', '#fde68a')
      await playTreasureReveal(this, { chest: result.chest, iconFrame: result.iconFrame ?? 0, sfx: this.sfx, state: this.state })
      playMinerIdleAnimation(this.player)
      this.isDigging = false
      if (goHomeIfNoDigs(this)) return
      if (this.visitDigs <= 0) this._exitCave()
      return
    }

    if (result.outcome.type === 'gem') {
      const crystal = result.crystal ?? result.rollCrystal()
      if (result.surfaceGemClaimed) {
        this.surfaceGemMarkers?.remove(result.key)
      }
      addGem(this.state, crystal.key, 1)
      const depthBonus = (result.digCount - 1) * 6
      addScore(this.state, crystal.points + depthBonus + (onOre ? 10 : 0))
      await this._showCrystalPickup(at, crystal, result.digCount)
      playMinerIdleAnimation(this.player)
      this.isDigging = false
      if (goHomeIfNoDigs(this)) return
      if (this.visitDigs <= 0) this._exitCave()
      return
    }

    this.sfx.empty()
    addScore(this.state, onOre ? 5 : 1)
    const depthMsg =
      result.digCount === 1
        ? onOre
          ? 'Sparkle dust... dig deeper!'
          : 'Dusty... dig deeper!'
        : onOre
          ? 'More dust...'
          : 'Nothing here...'
    this.hud.floatText(at.x, at.y - 18, depthMsg, '#cbd5e1')

    playMinerIdleAnimation(this.player)
    this.isDigging = false

    if (goHomeIfNoDigs(this)) return
    if (this.visitDigs <= 0) this._exitCave()
  }

  _showCrystalPickup(at, crystal, depth = 1) {
    return new Promise((resolve) => {
      const gem = createCrystalSprite(this, at.x, at.y - 20, crystal.frame, 48).setDepth(800)
      this.sfx.gemsInChest()
      const depthLabel = depth > 1 ? ` deep x${depth}` : ''
      this.hud.floatText(
        at.x,
        at.y - 40,
        `Cave! +${crystal.points} ${crystal.label}${depthLabel}`,
        '#bbf7d0',
      )
      this.time.delayedCall(1000, () => {
        gem.destroy()
        resolve()
      })
    })
  }

  update(time) {
    this.hud.update()
    this.player.setDepth(this.player.y)
    this.batManager?.update(time)

    if (this.revealActive || this.isDigging) {
      this.player.body.setVelocity(0, 0)
      return
    }

    const moving = this.updateClickToMove()
    const vx = this.player.body.velocity.x
    const vy = this.player.body.velocity.y

    if (!moving && this.pendingChest) {
      void this.chestManager.tryOpenEntry(this.pendingChest).then((opened) => {
        if (opened) this.pendingChest = null
      })
      return
    }

    if (!moving && this.pendingDig) {
      const digAt = this.pendingDig
      this.pendingDig = null
      this._startDig(digAt)
      return
    }

    updateMinerMovementAnimation(this.player, vx, vy)
  }
}
