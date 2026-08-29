import Phaser from 'phaser'
import {
  createBoatTextures,
  createBoatViewGraphics,
  redrawBoatView,
  playWhaleExplosion,
  spawnPoisonSkull,
  addFishWave,
  playFishHitReaction,
  setupSharkJump,
  showBlockShield,
} from '../boat/boatArt.js'
import { preloadBoatAssets, SHARK_KEY, FISH_KEY } from '../boat/boatAssets.js'

const SHARK_SPEED = 55 * 1.04
const FISH_SPEED = 48
const BULLET_SPEED = 420
const ENEMY_BULLET_SPEED = 300
const PEDAL_SPEED = 160
const SPAWN_MS = 1470
const JUMPING_SHARK_CHANCE = 0.38
const FISH_SPAWN_CHANCE = 0.32
const SHARK_SHOOTER_CHANCE = 0.4

export class BoatScene extends Phaser.Scene {
  constructor() {
    super('BoatScene')
  }

  preload() {
    preloadBoatAssets(this)
  }

  init(data) {
    this.sfx = data.sfx ?? this.registry.get('sfx')
    this.returnScene = data.returnScene ?? 'TitleScene'
    this.score = 0
  }

  create() {
    const w = this.scale.width
    const h = this.scale.height

    createBoatTextures(this)
    this._drawOcean(w, h)

    this.boatX = w / 2
    this.boatY = h - 72
    this.pedalLeftDown = false
    this.pedalRightDown = false
    this.isBlocking = false
    this.canShoot = true

    this.sharks = this.physics.add.group()
    this.fish = this.physics.add.group()
    this.bullets = this.physics.add.group()
    this.enemyBullets = this.physics.add.group()

    this.boatView = createBoatViewGraphics(this)
    redrawBoatView(this.boatView, { width: w, height: h, boatX: this.boatX })

    this.boatSprite = this.add
      .image(this.boatX, this.boatY, 'boat-hull')
      .setDepth(850)
      .setScrollFactor(0)

    this.gun = this.add
      .image(this.boatX + 8, h - 98, 'boat-gun')
      .setDepth(860)
      .setScrollFactor(0)

    this.leftPedal = this.add
      .image(this.boatX - 42, h - 34, 'boat-pedal')
      .setDepth(870)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })

    this.rightPedal = this.add
      .image(this.boatX + 42, h - 34, 'boat-pedal')
      .setFlipX(true)
      .setDepth(870)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })

    this._wirePedal(this.leftPedal, 'left')
    this._wirePedal(this.rightPedal, 'right')
    this._addBlockButton(w, h)

    this.boatZone = this.add.zone(this.boatX, this.boatY, 110, 56)
    this.physics.add.existing(this.boatZone)
    this.boatZone.body.setAllowGravity(false)
    this.boatZone.body.setImmovable(true)
    this.boatZone.setScrollFactor(0)

    this.scoreText = this.add
      .text(16, 14, 'Score: 0', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#e0f2fe',
        backgroundColor: 'rgba(0,0,0,0.45)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setDepth(1000)
      .setScrollFactor(0)

    this.add
      .text(w / 2, 14, 'BOAT SHARK HUNT', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#fde68a',
      })
      .setOrigin(0.5, 0)
      .setDepth(1000)
      .setScrollFactor(0)

    this.add
      .text(w / 2, h - 118, 'Space = shoot  |  Ctrl = block  |  Avoid fish (-1)', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#bae6fd',
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setScrollFactor(0)

    const backBtn = this.add
      .text(w - 16, 14, '← Back', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.45)',
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(1000)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })

    backBtn.on('pointerdown', () => this._exit())

    this.physics.add.overlap(
      this.bullets,
      this.sharks,
      (bullet, shark) => {
        if (bullet.active) bullet.destroy()
        this._onSharkHit(shark)
      },
      undefined,
      this,
    )

    this.physics.add.overlap(
      this.bullets,
      this.fish,
      (bullet, fishSprite) => {
        if (bullet.active) bullet.destroy()
        this._onFishHit(fishSprite)
      },
      undefined,
      this,
    )

    this.physics.add.overlap(
      this.enemyBullets,
      this.boatZone,
      (bullet) => this._onEnemyBulletHitBoat(bullet),
      undefined,
      this,
    )

    this.input.on('pointerdown', (p) => {
      if (p.y < h - 140) this._shoot()
    })

    this._bindKeyboard()

    this.nextSpawnAt = this.time.now + 1200
  }

  _bindKeyboard() {
    const kb = this.input.keyboard
    if (!kb) return

    kb.on('keydown-SPACE', (e) => {
      e.preventDefault()
      this._shoot()
    })

    const blockDown = () => this._setBlocking(true)
    const blockUp = () => this._setBlocking(false)

    kb.on('keydown-CTRL', blockDown)
    kb.on('keyup-CTRL', blockUp)
    kb.on('keydown-CONTROL', blockDown)
    kb.on('keyup-CONTROL', blockUp)

    kb.on('keydown-A', () => { this.pedalLeftDown = true })
    kb.on('keydown-D', () => { this.pedalRightDown = true })
    kb.on('keydown-LEFT', () => { this.pedalLeftDown = true })
    kb.on('keydown-RIGHT', () => { this.pedalRightDown = true })
    kb.on('keyup-A', () => { this.pedalLeftDown = false })
    kb.on('keyup-D', () => { this.pedalRightDown = false })
    kb.on('keyup-LEFT', () => { this.pedalLeftDown = false })
    kb.on('keyup-RIGHT', () => { this.pedalRightDown = false })
    kb.on('keydown-ESC', () => this._exit())
  }

  _addBlockButton(w, h) {
    const btn = this.add
      .text(this.boatX, h - 58, '🛡 BLOCK', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#e0f2fe',
        backgroundColor: 'rgba(30,58,138,0.75)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setOrigin(0.5)
      .setDepth(875)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })

    this.blockBtn = btn

    btn.on('pointerdown', () => this._setBlocking(true))
    btn.on('pointerup', () => this._setBlocking(false))
    btn.on('pointerout', () => this._setBlocking(false))
  }

  _setBlocking(active) {
    this.isBlocking = active
    showBlockShield(this, this.boatX, this.boatY - 8, active)
    if (this.blockBtn) {
      this.blockBtn.setBackgroundColor(active ? 'rgba(59,130,246,0.95)' : 'rgba(30,58,138,0.75)')
    }
  }

  _drawOcean(w, h) {
    const sky = this.add.graphics().setDepth(0)
    sky.fillGradientStyle(0x7dd3fc, 0x7dd3fc, 0x0ea5e9, 0x0369a1, 1)
    sky.fillRect(0, 0, w, h * 0.45)

    const water = this.add.graphics().setDepth(1)
    water.fillGradientStyle(0x0284c7, 0x0284c7, 0x075985, 0x0c4a6e, 1)
    water.fillRect(0, h * 0.35, w, h * 0.65)

    for (let i = 0; i < 8; i++) {
      const wave = this.add
        .ellipse(Phaser.Math.Between(40, w - 40), h * 0.42 + i * 28, 120 + i * 20, 12, 0xffffff, 0.08)
        .setDepth(2)
      this.tweens.add({
        targets: wave,
        x: '+=30',
        duration: 2000 + i * 200,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  _wirePedal(pedal, side) {
    const down = () => {
      if (side === 'left') this.pedalLeftDown = true
      else this.pedalRightDown = true
      this.tweens.add({
        targets: pedal,
        angle: side === 'left' ? -18 : 18,
        duration: 80,
      })
    }
    const up = () => {
      if (side === 'left') this.pedalLeftDown = false
      else this.pedalRightDown = false
      this.tweens.add({ targets: pedal, angle: 0, duration: 80 })
    }
    pedal.on('pointerdown', down)
    pedal.on('pointerup', up)
    pedal.on('pointerout', up)
  }

  _shoot() {
    if (!this.canShoot) return
    this.canShoot = false
    this.sfx?.boatShoot?.()

    const bullet = this.bullets.create(this.gun.x + 20, this.gun.y - 8, 'boat-bullet')
    bullet.body.setAllowGravity(false)
    bullet.setVelocityY(-BULLET_SPEED)
    bullet.setDepth(800)
    bullet.setScrollFactor(0)

    this.tweens.add({
      targets: this.gun,
      angle: -8,
      duration: 60,
      yoyo: true,
      onComplete: () => this.gun.setAngle(0),
    })

    this.time.delayedCall(180, () => {
      this.canShoot = true
    })

    this.time.delayedCall(2500, () => {
      if (bullet.active) bullet.destroy()
    })
  }

  _spawnShark() {
    const w = this.scale.width
    const h = this.scale.height
    const fromLeft = Math.random() > 0.5
    const y = Phaser.Math.Between(Math.floor(h * 0.28), Math.floor(h * 0.72))
    const x = fromLeft ? -50 : w + 50
    const surfaceY = h * 0.42

    const shark = this.sharks.create(x, y, SHARK_KEY)
    shark.setScale(0.85)
    shark.body.setAllowGravity(false)
    shark.setVelocityX(fromLeft ? SHARK_SPEED : -SHARK_SPEED)
    shark.setFlipX(!fromLeft)
    shark.setDepth(y)
    shark.body.setSize(shark.displayWidth * 0.75, shark.displayHeight * 0.55)
    shark.body.setOffset(shark.displayWidth * 0.12, shark.displayHeight * 0.22)

    const isJumper = Math.random() < JUMPING_SHARK_CHANCE
    if (isJumper) {
      setupSharkJump(this, shark, surfaceY)
    } else {
      this.tweens.add({
        targets: shark,
        y: y + Phaser.Math.Between(-12, 12),
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    if (Math.random() < SHARK_SHOOTER_CHANCE) {
      shark.isShooter = true
      shark.nextShotAt = this.time.now + Phaser.Math.Between(900, 1800)
    }
  }

  _spawnFish() {
    const w = this.scale.width
    const h = this.scale.height
    const fromLeft = Math.random() > 0.5
    const y = Phaser.Math.Between(Math.floor(h * 0.32), Math.floor(h * 0.68))
    const x = fromLeft ? -50 : w + 50

    const fishSprite = this.fish.create(x, y, FISH_KEY)
    fishSprite.setScale(0.85)
    fishSprite.body.setAllowGravity(false)
    fishSprite.setVelocityX(fromLeft ? FISH_SPEED : -FISH_SPEED)
    fishSprite.setFlipX(!fromLeft)
    fishSprite.setDepth(y)
    fishSprite.body.setSize(fishSprite.displayWidth * 0.7, fishSprite.displayHeight * 0.65)
    fishSprite.body.setOffset(fishSprite.displayWidth * 0.15, fishSprite.displayHeight * 0.18)

    addFishWave(this, fishSprite)
  }

  _sharkTryShoot(shark, time) {
    if (!shark.isShooter || !shark.active) return
    if (time < shark.nextShotAt) return
    if (Math.abs(shark.x - this.boatX) > 140) return

    shark.nextShotAt = time + Phaser.Math.Between(1600, 2800)

    const bullet = this.enemyBullets.create(shark.x, shark.y + 18, 'enemy-bullet')
    bullet.body.setAllowGravity(false)
    bullet.setVelocity(0, ENEMY_BULLET_SPEED)
    bullet.setDepth(820)

    this.time.delayedCall(3500, () => {
      if (bullet.active) bullet.destroy()
    })
  }

  _onEnemyBulletHitBoat(bullet) {
    if (!bullet.active) return
    const { x, y } = bullet
    bullet.destroy()

    if (this.isBlocking) {
      this.hudFloat(x, y, 'Blocked!', '#93c5fd')
      return
    }

    this.score = Math.max(0, this.score - 1)
    this.scoreText.setText(`Score: ${this.score}`)
    this.hudFloat(this.boatX, this.boatY - 50, 'Hit! -1', '#f87171')
    this.cameras.main.shake(100, 0.01)
  }

  _onFishHit(fishSprite) {
    if (!fishSprite.active) return

    const { x, y } = fishSprite
    const depth = fishSprite.depth
    fishSprite.destroy()

    playFishHitReaction(this, x, y, depth)

    this.score = Math.max(0, this.score - 1)
    this.scoreText.setText(`Score: ${this.score}`)
    this.hudFloat(x, y - 40, '-1 point!', '#f87171')
    this.cameras.main.shake(80, 0.008)
  }

  _onSharkHit(shark) {
    if (!shark.active) return

    const { x, y } = shark
    const depth = shark.depth
    shark.destroy()

    playWhaleExplosion(this, x, y, depth)
    spawnPoisonSkull(this, x, y - 8, depth)

    this.score += 1
    this.scoreText.setText(`Score: ${this.score}`)
    this.sfx?.whaleExplosion?.()
    this.hudFloat(x, y - 40, '+1 point!', '#fde047')
    this.cameras.main.shake(120, 0.01)
  }

  hudFloat(x, y, msg, color) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '18px',
        color,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(950)
      .setScrollFactor(0)
    this.tweens.add({
      targets: t,
      y: y - 30,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    })
  }

  _exit() {
    this.scene.start(this.returnScene, { sfx: this.sfx })
  }

  update(time, delta) {
    const w = this.scale.width
    const h = this.scale.height
    let vx = 0
    if (this.pedalLeftDown) vx -= PEDAL_SPEED
    if (this.pedalRightDown) vx += PEDAL_SPEED

    this.boatX = Phaser.Math.Clamp(this.boatX + vx * (delta / 1000), 100, w - 100)
    this.boatY = h - 72

    this.boatSprite.setX(this.boatX)
    this.gun.setPosition(this.boatX + 8, h - 98)
    this.leftPedal.setPosition(this.boatX - 42, h - 34)
    this.rightPedal.setPosition(this.boatX + 42, h - 34)
    this.blockBtn?.setX(this.boatX)
    this.boatZone.setPosition(this.boatX, this.boatY)

    if (this.isBlocking) {
      showBlockShield(this, this.boatX, this.boatY - 8, true)
    }

    redrawBoatView(this.boatView, { width: w, height: h, boatX: this.boatX })

    if (time >= this.nextSpawnAt) {
      this._spawnShark()
      if (Math.random() < 0.35) {
        this.time.delayedCall(350, () => this._spawnShark())
      }
      if (Math.random() < FISH_SPAWN_CHANCE) {
        this.time.delayedCall(Phaser.Math.Between(200, 600), () => this._spawnFish())
      }
      this.nextSpawnAt = time + SPAWN_MS + Phaser.Math.Between(-350, 450)
    }

    for (const shark of this.sharks.getChildren()) {
      if (!shark.active) continue
      this._sharkTryShoot(shark, time)
      if (shark.x < -100 || shark.x > w + 100) shark.destroy()
    }

    for (const fishSprite of this.fish.getChildren()) {
      if (!fishSprite.active) continue
      if (fishSprite.x < -100 || fishSprite.x > w + 100) fishSprite.destroy()
    }

    for (const bullet of this.enemyBullets.getChildren()) {
      if (!bullet.active) continue
      if (bullet.y > h + 20) bullet.destroy()
    }
  }
}
