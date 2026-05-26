import { CRYSTAL_TYPES } from '../systems/LootTables.js'
import { ensureHealth } from '../gameState.js'

export class HUD {
  constructor(scene, state) {
    this.scene = scene
    this.state = state
    ensureHealth(this.state)
    this.w = scene.scale.width
    this.h = scene.scale.height

    const pad = 12
    this.digsText = scene.add
      .text(pad, pad, '', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    this.scoreText = scene.add
      .text(pad, pad + 24, '', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    this.hintText = scene.add
      .text(pad, pad + 48, '', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#cbd5e1',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    const heartStartX = this.w - 118
    const heartY = pad + 6

    this.healthLabel = scene.add
      .text(heartStartX, heartY, 'Health', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#fca5a5',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    this.hearts = []
    for (let i = 0; i < 3; i++) {
      const heart = scene.add
        .text(heartStartX + i * 32, heartY + 22, '♥', {
          fontFamily: 'system-ui, Segoe UI, sans-serif',
          fontSize: '28px',
          color: '#ef4444',
          stroke: '#450a0a',
          strokeThickness: 2,
        })
        .setScrollFactor(0)
        .setDepth(1001)
      this.hearts.push(heart)
    }

    this.healthBg = scene.add
      .rectangle(heartStartX - 8, heartY - 4, 118, 58, 0x000000, 0.45)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(999)

    this.logOpen = false
    this.logPanel = scene.add
      .rectangle(this.w / 2, this.h / 2, 340, 280, 0x000000, 0.75)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false)

    this.logTitle = scene.add
      .text(this.w / 2, this.h / 2 - 120, '', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#fde047',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002)
      .setVisible(false)

    this.logText = scene.add
      .text(this.w / 2, this.h / 2 - 80, '', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        lineSpacing: 6,
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1002)
      .setVisible(false)

    this.gemsBtn = scene.add
      .rectangle(this.w - 90, 36, 150, 40, 0x7c3aed, 0.9)
      .setStrokeStyle(2, 0xc4b5fd)
      .setScrollFactor(0)
      .setDepth(1003)
      .setInteractive({ useHandCursor: true })

    this.gemsBtnLabel = scene.add
      .text(this.w - 90, 36, 'My Gems', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1004)

    this.gemsBtn.on('pointerover', () => this.gemsBtn.setFillStyle(0x6d28d9, 0.95))
    this.gemsBtn.on('pointerout', () => this.gemsBtn.setFillStyle(0x7c3aed, 0.9))
    this.gemsBtn.on('pointerdown', () => this.setLogOpen(!this.logOpen))

    scene.input.keyboard?.on('keydown-L', () => {
      this.setLogOpen(!this.logOpen)
    })
  }

  setLogOpen(open) {
    if (this.scene.revealActive) return
    this.logOpen = open
    this.logPanel.setVisible(open)
    this.logTitle.setVisible(open)
    this.logText.setVisible(open)
    if (open) this.refreshLog()
  }

  refreshLog() {
    const g = this.state.gems
    const lines = []
    for (const c of CRYSTAL_TYPES) {
      lines.push(`${c.label}: ${g[c.key] ?? 0}`)
    }
    lines.push(`Extra Dig Gems: ${g.extraDig ?? 0}`)
    this.logTitle.setText(`Score: ${this.state.score}`)
    this.logText.setText(lines.join('\n'))
  }

  floatText(x, y, text, color = '#ffffff') {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '16px',
        color,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(900)
    this.scene.tweens.add({
      targets: t,
      y: y - 28,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    })
  }

  updateHearts() {
    ensureHealth(this.state)
    const hp = this.state.health
    for (let i = 0; i < this.hearts.length; i++) {
      const filled = i < hp
      this.hearts[i].setText(filled ? '♥' : '♡')
      this.hearts[i].setColor(filled ? '#ef4444' : '#475569')
      this.hearts[i].setAlpha(filled ? 1 : 0.55)
    }
  }

  /** Call after bat hit — pops the heart that was just lost. */
  onDamage() {
    this.updateHearts()
    const lostIndex = this.state.health
    if (lostIndex < 0 || lostIndex >= this.hearts.length) return
    const heart = this.hearts[lostIndex]
    this.scene.tweens.add({
      targets: heart,
      scale: 1.45,
      alpha: 0.2,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
    })
  }

  update() {
    this.digsText.setText(`Digs: ${this.state.digsLeft}/${this.state.digsMax}`)
    this.scoreText.setText(`Score: ${this.state.score}`)
    this.hintText.setText(
      this.scene.hudHint ??
        'Click to move. Dig the ground or open glowing chests.',
    )

    this.updateHearts()

    const hideUi = this.scene.revealActive
    this.gemsBtn.setVisible(!hideUi)
    this.gemsBtnLabel.setVisible(!hideUi)
    this.healthBg.setVisible(!hideUi)
    this.healthLabel.setVisible(!hideUi)
    this.hearts.forEach((h) => h.setVisible(!hideUi))

    if (this.logOpen) this.refreshLog()
  }
}
