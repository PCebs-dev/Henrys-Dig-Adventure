import Phaser from 'phaser'
import { createInitialGameState } from '../gameState.js'
import { Sfx } from '../audio/Sfx.js'
import idleFront from '../assets/Sprites/Character/idle-front.png'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene')
  }

  preload() {
    this.load.spritesheet('title-miner-sheet', idleFront, {
      frameWidth: 32,
      frameHeight: 32,
    })
  }

  create() {
    const w = this.scale.width
    const h = this.scale.height
    const cx = w / 2

    if (!this.registry.get('sfx')) {
      this.registry.set('sfx', new Sfx())
    }

    this._drawBackdrop(w, h)
    this._addDecorations(w, h)
    this._addMinerHero(cx, h)
    this._addTitleText(cx)
    this._addStartButton(cx, h)
  }

  _drawBackdrop(w, h) {
    const g = this.add.graphics().setDepth(0)

    g.fillGradientStyle(0x1c1917, 0x1c1917, 0x451a03, 0x292524, 1)
    g.fillRect(0, 0, w, h)

    g.fillStyle(0x78350f, 0.35)
    for (let y = 0; y < h; y += 48) {
      g.fillRect(0, y, w, 24)
    }

    g.fillStyle(0x000000, 0.25)
    g.fillTriangle(0, h, w * 0.35, h * 0.55, 0, h * 0.45)
    g.fillTriangle(w, h, w * 0.65, h * 0.5, w, h * 0.42)
  }

  _addDecorations(w, h) {
    const gemColors = [0xfbbf24, 0x22d3ee, 0xa78bfa, 0x4ade80, 0xf472b6]

    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(40, w - 40)
      const y = Phaser.Math.Between(60, h - 140)
      const size = Phaser.Math.Between(4, 9)
      const gem = this.add
        .circle(x, y, size, gemColors[i % gemColors.length], 0.85)
        .setDepth(2)
      this.tweens.add({
        targets: gem,
        alpha: 0.25,
        scale: 1.35,
        duration: 900 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    const pick = this.add.graphics().setDepth(3)
    pick.fillStyle(0x78716c, 1)
    pick.fillRect(w - 110, h - 200, 12, 70)
    pick.fillStyle(0xd97706, 1)
    pick.fillTriangle(w - 130, h - 200, w - 88, h - 200, w - 109, h - 235)
    pick.setAngle(-18)

    this.add
      .text(52, h - 88, '⛏', { fontSize: '42px' })
      .setDepth(3)
      .setAlpha(0.7)
  }

  _addMinerHero(cx, h) {
    if (!this.anims.exists('title-miner-idle')) {
      this.anims.create({
        key: 'title-miner-idle',
        frames: this.anims.generateFrameNumbers('title-miner-sheet', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      })
    }

    const platform = this.add
      .ellipse(cx, h * 0.58 + 58, 200, 36, 0x000000, 0.35)
      .setDepth(4)

    const glow = this.add
      .circle(cx, h * 0.58 - 10, 90, 0xfbbf24, 0.08)
      .setDepth(5)

    this.tweens.add({
      targets: glow,
      scale: 1.15,
      alpha: 0.18,
      duration: 1400,
      yoyo: true,
      repeat: -1,
    })

    const miner = this.add
      .sprite(cx, h * 0.58, 'title-miner-sheet', 0)
      .setScale(5)
      .setDepth(10)

    miner.play('title-miner-idle')

    this.tweens.add({
      targets: miner,
      y: h * 0.58 - 12,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.tweens.add({
      targets: platform,
      scaleX: 1.06,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  _addTitleText(cx) {
    this.add
      .text(cx, 72, "HENRY'S", {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#fde68a',
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(20)

    this.add
      .text(cx, 108, 'DIG ADVENTURE', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '40px',
        color: '#fef3c7',
        fontStyle: 'bold',
        stroke: '#92400e',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(20)

    this.add
      .text(cx, 158, 'Click, dig, sparkle — find the treasure!', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#fcd34d',
      })
      .setOrigin(0.5)
      .setDepth(20)
  }

  _addStartButton(cx, h) {
    const btnY = h - 88
    const btnW = 240
    const btnH = 56

    this.add
      .rectangle(cx, btnY + 4, btnW, btnH, 0x000000, 0.4)
      .setDepth(29)

    const btn = this.add
      .rectangle(cx, btnY, btnW, btnH, 0x16a34a)
      .setStrokeStyle(4, 0xfef08a)
      .setDepth(30)
      .setInteractive({ useHandCursor: true })

    const label = this.add
      .text(cx, btnY, 'START', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(31)

    const pulse = { targets: btn, scaleX: 1.04, scaleY: 1.04, duration: 700, yoyo: true, repeat: -1 }
    this.tweens.add(pulse)
    this.tweens.add({ ...pulse, targets: label })

    const hoverIn = () => {
      btn.setFillStyle(0x22c55e)
      btn.setStrokeStyle(4, 0xffffff)
    }
    const hoverOut = () => {
      btn.setFillStyle(0x16a34a)
      btn.setStrokeStyle(4, 0xfef08a)
    }

    btn.on('pointerover', hoverIn)
    btn.on('pointerout', hoverOut)
    label.setInteractive({ useHandCursor: true })
    label.on('pointerover', hoverIn)
    label.on('pointerout', hoverOut)

    const start = async () => {
      const sfx = this.registry.get('sfx')
      await sfx.unlock()
      sfx.chestFound()
      this.cameras.main.fadeOut(350, 0, 0, 0)
      this.time.delayedCall(380, () => {
        const fresh = createInitialGameState()
        this.registry.set('gameState', fresh)
        this.scene.start('BootScene', { gameState: fresh, sfx })
      })
    }

    btn.on('pointerdown', start)
    label.on('pointerdown', start)
    this.input.keyboard?.on('keydown-ENTER', () => void start())
    this.input.keyboard?.on('keydown-SPACE', () => void start())
  }
}
