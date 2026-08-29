import Phaser from 'phaser'
import { HUD } from '../ui/HUD.js'
import { DigSystem } from '../systems/DigSystem.js'
import { consumeDig } from '../gameState.js'
import {
  spawnMiner,
  updateMinerMovementAnimation,
  playMinerDigAnimation,
  playMinerIdleAnimation,
} from '../characters/miner.js'
import { playTreasureReveal, goHomeIfNoDigs } from '../treasure/treasureReveal.js'
import { createCrystalSprite } from '../treasure/crystalFrames.js'
import { addGem, addScore } from '../gameState.js'
import { generateTopWorld } from '../worlds/generators/topWorldGenerator.js'
import { buildTopWorldMap } from '../worlds/MapBuilder.js'
import { setupClickToMove } from '../movement/clickToMove.js'
import { DragonManager } from '../enemies/dragon.js'
import { MapChestManager } from '../treasure/mapChestManager.js'
import { spawnSurfaceGemMarkers } from '../worlds/surfaceGemMarkers.js'
import { scatterTreasureDecor } from '../treasure/treasureDecorScatter.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  init(data) {
    this.state = data.gameState
    this.sfx = data.sfx
    this.worldId = 'top'
    this.mapSeed = data.mapSeed ?? Date.now()
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1220')
    if (this.cameras.main.alpha < 1) {
      this.cameras.main.fadeIn(400, 0, 0, 0)
    }

    this.input.once('pointerdown', async () => {
      await this.sfx.unlock()
    })

    const layout = generateTopWorld(this.mapSeed)
    this.map = buildTopWorldMap(this, layout)
    const { worldW, worldH } = this.map

    this.physics.world.setBounds(0, 0, worldW, worldH)

    this.add
      .text(worldW / 2, 26, 'Top World', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#e2e8f0',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(500)

    this.player = spawnMiner(this, this.map.spawnX, this.map.spawnY)
    this.physics.add.collider(this.player, this.map.obstacles)

    this.target = new Phaser.Math.Vector2(this.player.x, this.player.y)
    this.isDigging = false
    this.pendingDig = null
    this.revealActive = false
    this.pendingChest = null

    this.hud = new HUD(this, this.state)
    this.hudHint =
      'Sparkling gems are visible on the surface. Dig deeper for better loot — chests hide in special spots!'
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
      count: 16,
    })
    this.dragonManager = new DragonManager(this)
    setupClickToMove(this, { map: this.map, speed: 180 })

    this.cursor = this.add
      .circle(this.player.x, this.player.y, 6)
      .setStrokeStyle(2, 0xa78bfa, 1)
      .setAlpha(0)

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setBounds(0, 0, worldW, worldH)

    this.input.on('pointerdown', (p) => {
      if (this.revealActive || this.isDigging) return
      this._handleMapClick(p.worldX, p.worldY)
      this.cursor.setPosition(p.worldX, p.worldY)
      this.cursor.setAlpha(1)
      this.tweens.add({ targets: this.cursor, alpha: 0, duration: 550, ease: 'Quad.easeOut' })
    })
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

  _startDig(at) {
    if (this.isDigging || this.revealActive) return
    if (!this.map.isWalkableAt(at.x, at.y)) {
      this.hud.floatText(at.x, at.y - 18, "Can't dig here!", '#94a3b8')
      return
    }
    if (!consumeDig(this.state)) {
      this.hud.floatText(this.player.x, this.player.y - 20, 'No digs left!', '#fbbf24')
      goHomeIfNoDigs(this)
      return
    }

    if ([5, 3, 1].includes(this.state.digsLeft)) {
      this.sfx.lowDigs()
    }

    this.isDigging = true
    this.waypoints = []
    this.sfx.digStart()
    playMinerDigAnimation(this.player)

    const ring = this.add.circle(at.x, at.y, 6, 0x000000, 0).setStrokeStyle(2, 0xfbbf24, 1)
    this.tweens.add({
      targets: ring,
      radius: 22,
      alpha: 0,
      duration: 320,
      onComplete: () => ring.destroy(),
    })

    this.time.delayedCall(320, () => {
      this._resolveDig(at)
    })
  }

  async _resolveDig(at) {
    const result = this.dig.digAt({ x: at.x, y: at.y, worldId: this.worldId })

    if (result.outcome.type === 'buried_chest') {
      this.hud.floatText(at.x, at.y - 24, 'Buried treasure!', '#fde68a')
      await playTreasureReveal(this, { chest: result.chest, iconFrame: result.iconFrame ?? 0, sfx: this.sfx, state: this.state })
      playMinerIdleAnimation(this.player)
      this.isDigging = false
      goHomeIfNoDigs(this)
      return
    }

    if (result.digCount >= 3) {
      this._enterCave(at)
      return
    }

    if (result.outcome.type === 'gem') {
      const crystal = result.crystal ?? result.rollCrystal()
      if (result.surfaceGemClaimed) {
        this.surfaceGemMarkers?.remove(result.key)
      }
      addGem(this.state, crystal.key, 1)
      const depthBonus = result.digCount > 1 ? 4 : 0
      addScore(this.state, crystal.points + depthBonus)
      await this._showCrystalPickup(at, crystal, result.digCount)
      playMinerIdleAnimation(this.player)
      this.isDigging = false
      goHomeIfNoDigs(this)
      return
    }

    if (result.digCount === 2) {
      this._showCrack(at)
      playMinerIdleAnimation(this.player)
      this.isDigging = false
      goHomeIfNoDigs(this)
      return
    }

    this.sfx.empty()
    const depthMsg =
      result.digCount === 1 ? 'Just dirt... dig deeper!' : 'Nothing here...'
    this.hud.floatText(at.x, at.y - 18, depthMsg, '#94a3b8')

    playMinerIdleAnimation(this.player)
    this.isDigging = false
    goHomeIfNoDigs(this)
  }

  _showCrystalPickup(at, crystal, depth = 1) {
    return new Promise((resolve) => {
      const gem = createCrystalSprite(this, at.x, at.y - 20, crystal.frame, 48).setDepth(800)
      this.sfx.gemsInChest()
      const depthLabel = depth > 1 ? ` (deep!)` : ''
      this.hud.floatText(
        at.x,
        at.y - 40,
        `+${crystal.points} ${crystal.label}${depthLabel}`,
        '#e2e8f0',
      )
      this.time.delayedCall(1000, () => {
        gem.destroy()
        resolve()
      })
    })
  }

  _showCrack(at) {
    this.sfx.caveRumble()
    const crack = this.add.circle(at.x, at.y, 10).setStrokeStyle(3, 0x111827, 1).setAlpha(0.9)
    this.hud.floatText(at.x, at.y - 18, 'CRACK!', '#fca5a5')
    this.tweens.add({ targets: crack, alpha: 0.25, yoyo: true, duration: 80, repeat: 3 })
  }

  _onPlayerDefeated(reason = 'enemies') {
    if (this.revealActive) return
    this.dragonManager?.destroy()
    this.chestManager?.destroy()
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
    this.dragonManager?.destroy()
    this.chestManager?.destroy()
    this.surfaceGemMarkers?.destroy()
    this.treasureDecor?.destroy()
  }

  _enterCave(at) {
    this.isDigging = false
    this.dragonManager?.destroy()
    this.chestManager?.destroy()
    this.surfaceGemMarkers?.destroy()
    this.treasureDecor?.destroy()
    playMinerIdleAnimation(this.player)
    this.sfx.caveRumble()
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.time.delayedCall(320, () => {
      this.scene.start('CaveScene', {
        gameState: this.state,
        sfx: this.sfx,
        returnScene: 'GameScene',
        mapSeed: this.mapSeed + 1,
      })
    })
  }

  update(time) {
    this.hud.update()
    this.player.setDepth(this.player.y)
    this.dragonManager?.update(time)

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
