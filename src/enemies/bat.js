import Phaser from 'phaser'
import { takeDamage, isAlive } from '../gameState.js'
import {
  createBatAnimations,
  getBatSpriteKey,
  getBatAnimKey,
  hasBatArt,
} from './batAssets.js'

const BAT_SPEED = 55
const WANDER_INTERVAL_MS = 2200
const MAX_BATS = 2
const SPAWN_MIN_MS = 12000
const SPAWN_MAX_MS = 22000
const HIT_COOLDOWN_MS = 1400

export function ensureBatTexture(scene) {
  if (scene.textures.exists('bat')) return

  const g = scene.make.graphics({ x: 0, y: 0, add: false })
  g.fillStyle(0x1e1b4b, 1)
  g.fillEllipse(16, 14, 10, 8)
  g.fillStyle(0x4c1d95, 1)
  g.fillTriangle(2, 10, 14, 16, 2, 20)
  g.fillTriangle(30, 10, 18, 16, 30, 20)
  g.fillStyle(0xf472b6, 1)
  g.fillCircle(13, 12, 2)
  g.fillCircle(19, 12, 2)
  g.generateTexture('bat', 32, 24)
  g.destroy()
}

export class BatManager {
  constructor(scene) {
    this.scene = scene
    this.bats = scene.physics.add.group()
    this.nextSpawnAt = scene.time.now + Phaser.Math.Between(12000, 20000)
    this.playerHitUntil = 0
    this.useSpriteArt = hasBatArt()

    if (this.useSpriteArt) {
      createBatAnimations(scene)
    } else {
      ensureBatTexture(scene)
    }

    scene.physics.add.overlap(
      scene.player,
      this.bats,
      (_player, bat) => this._onBatHitPlayer(bat),
      undefined,
      scene,
    )
  }

  update(time) {
    const active = this.bats.getChildren().filter((b) => b.active)
    for (const bat of active) this._updateBatFlight(bat, time)

    if (active.length >= MAX_BATS) return
    if (time < this.nextSpawnAt) return
    if (this._shouldSkipSpawn()) {
      this.nextSpawnAt = time + 4000
      return
    }

    this._spawnBat()
    this.nextSpawnAt = time + Phaser.Math.Between(SPAWN_MIN_MS, SPAWN_MAX_MS)
  }

  destroy() {
    this.bats.clear(true, true)
  }

  _shouldSkipSpawn() {
    const s = this.scene
    return s.revealActive || s.isDigging || !isAlive(s.state)
  }

  _spawnBat() {
    const { player, map } = this.scene
    const cam = this.scene.cameras.main
    const margin = 48
    const side = Phaser.Math.Between(0, 3)
    let x = player.x
    let y = player.y - 40

    if (side === 0) {
      x = cam.scrollX - margin
      y = cam.scrollY + Phaser.Math.Between(40, cam.height - 40)
    } else if (side === 1) {
      x = cam.scrollX + cam.width + margin
      y = cam.scrollY + Phaser.Math.Between(40, cam.height - 40)
    } else if (side === 2) {
      x = cam.scrollX + Phaser.Math.Between(40, cam.width - 40)
      y = cam.scrollY - margin
    } else {
      x = cam.scrollX + Phaser.Math.Between(40, cam.width - 40)
      y = cam.scrollY + cam.height + margin
    }

    x = Phaser.Math.Clamp(x, 32, map.worldW - 32)
    y = Phaser.Math.Clamp(y, 32, map.worldH - 32)

    const textureKey = getBatSpriteKey()
    const bat = this.bats.create(x, y, textureKey)
    const scale = this.useSpriteArt ? 2.5 : 1.8

    bat.setOrigin(0.5, 0.5)
    bat.setScale(scale)
    bat.setDepth(900)
    bat.body.setAllowGravity(false)

    const animKey = getBatAnimKey()
    if (this.useSpriteArt && this.scene.anims.exists(animKey)) {
      bat.play(animKey)
      const bw = bat.displayWidth || 64
      const bh = bat.displayHeight || 48
      bat.body.setSize(bw * 0.55, bh * 0.5)
      bat.body.setOffset(bw * 0.22, bh * 0.25)
    } else {
      bat.body.setCircle(12, 8, 6)
    }

    bat.setCollideWorldBounds(true)
    bat.setBounce(0.85)
    bat.nextWander = 0
    bat.baseScale = scale

    this._pickWanderVelocity(bat)
  }

  _pickWanderVelocity(bat) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
    const speed = Phaser.Math.Between(35, BAT_SPEED)
    bat.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
  }

  _updateBatFlight(bat, time) {
    if (time >= bat.nextWander) {
      this._pickWanderVelocity(bat)
      bat.nextWander = time + WANDER_INTERVAL_MS + Phaser.Math.Between(-400, 600)
    }

    const scale = bat.baseScale ?? 2.5
    if (bat.body.velocity.x < -8) {
      bat.setScale(-Math.abs(scale), scale)
    } else if (bat.body.velocity.x > 8) {
      bat.setScale(Math.abs(scale), scale)
    }

    if (this.scene.anims.exists(getBatAnimKey()) && !bat.anims.isPlaying) {
      bat.play(getBatAnimKey())
    }

    bat.setDepth(bat.y)
  }

  _onBatHitPlayer(bat) {
    const scene = this.scene
    const now = scene.time.now
    if (now < this.playerHitUntil) return
    if (scene.revealActive || scene.isDigging) return
    if (!bat.active) return

    this.playerHitUntil = now + HIT_COOLDOWN_MS
    takeDamage(scene.state, 1)
    scene.sfx.batHit()
    scene.hud?.onDamage()

    scene.cameras.main.shake(120, 0.006)
    scene.tweens.add({
      targets: scene.player,
      alpha: 0.35,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => scene.player.setAlpha(1),
    })

    scene.hud.floatText(scene.player.x, scene.player.y - 36, 'Ouch! Bat bump!', '#fca5a5')

    const awayX = bat.x + (bat.x - scene.player.x) * 0.6
    const awayY = bat.y + (bat.y - scene.player.y) * 0.6
    bat.setVelocity(
      Phaser.Math.Clamp(awayX - bat.x, -120, 120),
      Phaser.Math.Clamp(awayY - bat.y, -120, 120),
    )

    scene.time.delayedCall(600, () => {
      if (bat.active) bat.destroy()
    })

    if (!isAlive(scene.state)) {
      scene.time.delayedCall(500, () => scene._onPlayerDefeated?.('bats'))
    }
  }
}
