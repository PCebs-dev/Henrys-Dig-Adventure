import Phaser from 'phaser'
import { takeDamage, isAlive } from '../gameState.js'
import {
  createDragonAnimations,
  getDragonSpriteKey,
  getDragonAnimKey,
  hasDragonArt,
} from './dragonAssets.js'

const MAX_DRAGONS = 4
const DRAGON_SPEED = 48
const WANDER_INTERVAL_MS = 2600
const SPAWN_MIN_MS = 6500
const SPAWN_MAX_MS = 11000
const HIT_COOLDOWN_MS = 1400

export function ensureDragonTexture(scene) {
  if (scene.textures.exists('dragon')) return

  const g = scene.make.graphics({ x: 0, y: 0, add: false })
  g.fillStyle(0xb45309, 1)
  g.fillEllipse(20, 18, 22, 14)
  g.fillStyle(0xfbbf24, 1)
  g.fillTriangle(4, 16, 20, 8, 20, 24)
  g.fillTriangle(36, 16, 20, 8, 20, 24)
  g.fillStyle(0x78350f, 1)
  g.fillCircle(14, 14, 3)
  g.fillCircle(26, 14, 3)
  g.fillStyle(0xfde68a, 0.8)
  g.fillEllipse(20, 22, 8, 4)
  g.generateTexture('dragon', 40, 32)
  g.destroy()
}

export class DragonManager {
  constructor(scene) {
    this.scene = scene
    this.dragons = scene.physics.add.group()
    this.nextSpawnAt = scene.time.now + Phaser.Math.Between(4000, 7000)
    this.playerHitUntil = 0
    const spriteKey = getDragonSpriteKey()
    if (hasDragonArt()) {
      createDragonAnimations(scene)
    }
    this.useSpriteArt = scene.textures.exists(spriteKey)
    if (!this.useSpriteArt) {
      ensureDragonTexture(scene)
    }

    scene.physics.add.overlap(
      scene.player,
      this.dragons,
      (_player, dragon) => this._onDragonHitPlayer(dragon),
      undefined,
      scene,
    )
  }

  _activeDragons() {
    return this.dragons.getChildren().filter((d) => d.active)
  }

  update(time) {
    for (const dragon of this._activeDragons()) {
      this._updateDragonMovement(dragon, time)
    }

    if (this._activeDragons().length >= MAX_DRAGONS) return
    if (time < this.nextSpawnAt) return
    if (this._shouldSkipSpawn()) {
      this.nextSpawnAt = time + 2000
      return
    }

    this._spawnDragon()
    this.nextSpawnAt = time + Phaser.Math.Between(SPAWN_MIN_MS, SPAWN_MAX_MS)
  }

  destroy() {
    this.dragons.clear(true, true)
  }

  _shouldSkipSpawn() {
    const s = this.scene
    return s.revealActive || s.isDigging || !isAlive(s.state)
  }

  _spawnDragon() {
    const { player, map } = this.scene
    const cam = this.scene.cameras.main
    const margin = 56
    const side = Phaser.Math.Between(0, 3)
    let x = player.x
    let y = player.y - 48

    if (side === 0) {
      x = cam.scrollX - margin
      y = cam.scrollY + Phaser.Math.Between(48, cam.height - 48)
    } else if (side === 1) {
      x = cam.scrollX + cam.width + margin
      y = cam.scrollY + Phaser.Math.Between(48, cam.height - 48)
    } else if (side === 2) {
      x = cam.scrollX + Phaser.Math.Between(48, cam.width - 48)
      y = cam.scrollY - margin
    } else {
      x = cam.scrollX + Phaser.Math.Between(48, cam.width - 48)
      y = cam.scrollY + cam.height + margin
    }

    x = Phaser.Math.Clamp(x, 40, map.worldW - 40)
    y = Phaser.Math.Clamp(y, 40, map.worldH - 40)

    const textureKey = this.useSpriteArt ? getDragonSpriteKey() : 'dragon'
    const dragon = this.dragons.create(x, y, textureKey, 0)
    const scale = this.useSpriteArt ? 4.5 : 2.2

    dragon.setOrigin(0.5, 0.5)
    dragon.setScale(scale)
    dragon.setDepth(900)
    dragon.body.setAllowGravity(false)

    const animKey = getDragonAnimKey()
    if (this.useSpriteArt && this.scene.anims.exists(animKey)) {
      dragon.play(animKey)
      const bw = dragon.displayWidth || 80
      const bh = dragon.displayHeight || 64
      dragon.body.setSize(bw * 0.6, bh * 0.45)
      dragon.body.setOffset(bw * 0.2, bh * 0.28)
    } else {
      dragon.body.setCircle(16, 10, 8)
    }

    dragon.setCollideWorldBounds(true)
    dragon.setBounce(0.85)
    dragon.nextWander = 0
    dragon.baseScale = scale

    this._pickWanderVelocity(dragon)
  }

  _pickWanderVelocity(dragon) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
    const speed = Phaser.Math.Between(30, DRAGON_SPEED)
    dragon.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
  }

  _updateDragonMovement(dragon, time) {
    if (time >= dragon.nextWander) {
      this._pickWanderVelocity(dragon)
      dragon.nextWander = time + WANDER_INTERVAL_MS + Phaser.Math.Between(-500, 700)
    }

    const scale = dragon.baseScale ?? 4.5
    if (dragon.body.velocity.x < -8) {
      dragon.setScale(-Math.abs(scale), scale)
    } else if (dragon.body.velocity.x > 8) {
      dragon.setScale(Math.abs(scale), scale)
    }

    const animKey = getDragonAnimKey()
    if (this.scene.anims.exists(animKey) && !dragon.anims.isPlaying) {
      dragon.play(animKey)
    }

    dragon.setDepth(dragon.y)
  }

  _onDragonHitPlayer(dragon) {
    const scene = this.scene
    const now = scene.time.now
    if (now < this.playerHitUntil) return
    if (scene.revealActive || scene.isDigging) return
    if (!dragon.active) return

    this.playerHitUntil = now + HIT_COOLDOWN_MS
    takeDamage(scene.state, 1)
    scene.sfx.dragonHit()
    scene.hud?.onDamage()

    scene.cameras.main.shake(140, 0.008)
    scene.tweens.add({
      targets: scene.player,
      alpha: 0.35,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => scene.player.setAlpha(1),
    })

    scene.hud.floatText(
      scene.player.x,
      scene.player.y - 36,
      'Roar! Dragon bump!',
      '#fcd34d',
    )

    const awayX = dragon.x + (dragon.x - scene.player.x) * 0.6
    const awayY = dragon.y + (dragon.y - scene.player.y) * 0.6
    dragon.setVelocity(
      Phaser.Math.Clamp(awayX - dragon.x, -110, 110),
      Phaser.Math.Clamp(awayY - dragon.y, -110, 110),
    )

    scene.time.delayedCall(700, () => {
      if (dragon.active) dragon.destroy()
    })

    if (!isAlive(scene.state)) {
      scene.time.delayedCall(500, () => scene._onPlayerDefeated?.('dragon'))
    }
  }
}
