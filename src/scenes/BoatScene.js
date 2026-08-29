import Phaser from 'phaser'
import {
  createBoatTextures,
  createBoatViewGraphics,
  redrawBoatView,
  addScaryWhaleEyes,
  playWhaleExplosion,
  spawnPoisonSkull,
  addSailorWave,
  playSailorHitReaction,
  setupWhaleJump,
} from '../boat/boatArt.js'

const WHALE_SPEED = 55 * 1.04
const SAILOR_SPEED = 48
const BULLET_SPEED = 420
const PEDAL_SPEED = 160
const SPAWN_MS = 1470
const JUMPING_WHALE_CHANCE = 0.38
const SAILOR_SPAWN_CHANCE = 0.32

export class BoatScene extends Phaser.Scene {
  constructor() {
    super('BoatScene')
  }

  init(data) {
    this.sfx = data.sfx ?? this.registry.get('sfx')
    this.returnScene = data.returnScene ?? 'TitleScene'
    this.whaleScore = 0
  }

  create() {
    const w = this.scale.width
    const h = this.scale.height

    createBoatTextures(this)
    this._drawOcean(w, h)

    this.boatX = w / 2
    this.pedalLeftDown = false
    this.pedalRightDown = false
    this.canShoot = true

    this.whales = this.physics.add.group()
    this.sailors = this.physics.add.group()
    this.bullets = this.physics.add.group()

    this.boatView = createBoatViewGraphics(this)
    redrawBoatView(this.boatView, { width: w, height: h, boatX: this.boatX })

    this.boatSprite = this.add
      .image(this.boatX, h - 72, 'boat-hull')
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

    this.scoreText = this.add
      .text(16, 14, 'Whales: 0', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#e0f2fe',
        backgroundColor: 'rgba(0,0,0,0.45)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setDepth(1000)
      .setScrollFactor(0)

    this.add
      .text(w / 2, 14, 'BOAT WHALE HUNT', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#fde68a',
      })
      .setOrigin(0.5, 0)
      .setDepth(1000)
      .setScrollFactor(0)

    this.add
      .text(w / 2, h - 118, 'Shoot whales (+1)  |  Avoid sailors (-1)', {
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
      this.whales,
      (bullet, whale) => {
        if (bullet.active) bullet.destroy()
        this._onWhaleHit(whale)
      },
      undefined,
      this,
    )

    this.physics.add.overlap(
      this.bullets,
      this.sailors,
      (bullet, sailor) => {
        if (bullet.active) bullet.destroy()
        this._onSailorHit(sailor)
      },
      undefined,
      this,
    )

    this.input.on('pointerdown', (p) => {
      if (p.y < h - 140) this._shoot()
    })

    this.input.keyboard?.on('keydown-SPACE', () => this._shoot())
    this.input.keyboard?.on('keydown-A', () => { this.pedalLeftDown = true })
    this.input.keyboard?.on('keydown-D', () => { this.pedalRightDown = true })
    this.input.keyboard?.on('keydown-LEFT', () => { this.pedalLeftDown = true })
    this.input.keyboard?.on('keydown-RIGHT', () => { this.pedalRightDown = true })
    this.input.keyboard?.on('keyup-A', () => { this.pedalLeftDown = false })
    this.input.keyboard?.on('keyup-D', () => { this.pedalRightDown = false })
    this.input.keyboard?.on('keyup-LEFT', () => { this.pedalLeftDown = false })
    this.input.keyboard?.on('keyup-RIGHT', () => { this.pedalRightDown = false })
    this.input.keyboard?.on('keydown-ESC', () => this._exit())

    this.nextSpawnAt = this.time.now + 1200
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

  _spawnWhale() {
    const w = this.scale.width
    const h = this.scale.height
    const fromLeft = Math.random() > 0.5
    const y = Phaser.Math.Between(Math.floor(h * 0.28), Math.floor(h * 0.72))
    const x = fromLeft ? -50 : w + 50
    const surfaceY = h * 0.42

    const whale = this.whales.create(x, y, 'whale')
    whale.body.setAllowGravity(false)
    whale.setVelocityX(fromLeft ? WHALE_SPEED : -WHALE_SPEED)
    whale.setFlipX(!fromLeft)
    whale.setDepth(y)
    whale.body.setSize(60, 28)
    whale.body.setOffset(10, 10)

    const isJumper = Math.random() < JUMPING_WHALE_CHANCE
    if (isJumper) {
      whale.isJumper = true
      setupWhaleJump(this, whale, surfaceY)
    } else {
      this.tweens.add({
        targets: whale,
        y: y + Phaser.Math.Between(-12, 12),
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    addScaryWhaleEyes(this, whale)
  }

  _spawnSailor() {
    const w = this.scale.width
    const h = this.scale.height
    const fromLeft = Math.random() > 0.5
    const y = Phaser.Math.Between(Math.floor(h * 0.32), Math.floor(h * 0.68))
    const x = fromLeft ? -50 : w + 50

    const sailor = this.sailors.create(x, y, 'sailor')
    sailor.body.setAllowGravity(false)
    sailor.setVelocityX(fromLeft ? SAILOR_SPEED : -SAILOR_SPEED)
    sailor.setFlipX(!fromLeft)
    sailor.setDepth(y)
    sailor.body.setSize(52, 40)
    sailor.body.setOffset(14, 8)
    sailor.isFriendly = true

    addSailorWave(this, sailor)
  }

  _onSailorHit(sailor) {
    if (!sailor.active) return

    const { x, y } = sailor
    const depth = sailor.depth
    sailor.destroy()

    playSailorHitReaction(this, x, y, depth)

    this.whaleScore = Math.max(0, this.whaleScore - 1)
    this.scoreText.setText(`Whales: ${this.whaleScore}`)
    this.hudFloat(x, y - 40, '-1 point!', '#f87171')
    this.cameras.main.shake(80, 0.008)
  }

  _onWhaleHit(whale) {
    if (!whale.active) return

    const { x, y } = whale
    const depth = whale.depth

    if (whale.scaryGlow?.active) whale.scaryGlow.destroy()
    whale.destroy()

    playWhaleExplosion(this, x, y, depth)
    spawnPoisonSkull(this, x, y - 8, depth)

    this.whaleScore += 1
    this.scoreText.setText(`Whales: ${this.whaleScore}`)
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

    this.boatSprite.setX(this.boatX)
    this.gun.setPosition(this.boatX + 8, h - 98)
    this.leftPedal.setPosition(this.boatX - 42, h - 34)
    this.rightPedal.setPosition(this.boatX + 42, h - 34)

    redrawBoatView(this.boatView, { width: w, height: h, boatX: this.boatX })

    if (time >= this.nextSpawnAt) {
      this._spawnWhale()
      if (Math.random() < 0.35) {
        this.time.delayedCall(350, () => this._spawnWhale())
      }
      if (Math.random() < SAILOR_SPAWN_CHANCE) {
        this.time.delayedCall(Phaser.Math.Between(200, 600), () => this._spawnSailor())
      }
      this.nextSpawnAt = time + SPAWN_MS + Phaser.Math.Between(-350, 450)
    }

    for (const whale of this.whales.getChildren()) {
      if (!whale.active) continue
      if (whale.scaryGlow?.active) {
        const flip = whale.flipX ? -1 : 1
        whale.scaryGlow.setPosition(whale.x + 26 * flip, whale.y - 4)
      }
      if (whale.x < -100 || whale.x > w + 100) whale.destroy()
    }

    for (const sailor of this.sailors.getChildren()) {
      if (!sailor.active) continue
      if (sailor.x < -100 || sailor.x > w + 100) sailor.destroy()
    }
  }
}
