import Phaser from 'phaser'
import { createInitialGameState } from '../gameState.js'

export class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene')
  }

  init(data) {
    this.state = data.gameState
    this.sfx = data.sfx
    this.reason = data.reason ?? 'digs'
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f172a')

    const w = this.scale.width
    const h = this.scale.height
    const cx = w / 2

    this.add
      .text(cx, 80, 'Henry\'s Dig Adventure', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '32px',
        color: '#fde047',
      })
      .setOrigin(0.5)

    const subtitle =
      this.reason === 'dragon'
        ? 'The young brass dragon got you! — try again!'
        : this.reason === 'bats'
          ? 'The bats got you! — try again!'
          : this.reason === 'enemies'
            ? 'The creatures got you! — try again!'
            : 'All 25 digs used — great job!'

    this.add
      .text(cx, 130, subtitle, {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5)

    this.add
      .text(cx, 180, `Final Score: ${this.state.score}`, {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    const g = this.state.gems
    const lines = Object.entries(g)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${formatGemName(key)}: ${count}`)

    this.add
      .text(cx, 230, lines.length ? lines.join('\n') : 'No gems found this run.', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#cbd5e1',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0)

    const btn = this.add
      .rectangle(cx, h - 100, 220, 52, 0x22c55e)
      .setStrokeStyle(3, 0xbbf7d0)
      .setInteractive({ useHandCursor: true })

    this.add
      .text(cx, h - 100, 'Play Again', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    btn.on('pointerover', () => btn.setFillStyle(0x16a34a))
    btn.on('pointerout', () => btn.setFillStyle(0x22c55e))
    btn.on('pointerdown', () => {
      const fresh = createInitialGameState()
      this.registry.set('gameState', fresh)
      this.scene.start('BootScene', { gameState: fresh, sfx: this.sfx })
    })
  }
}

function formatGemName(key) {
  if (key === 'extraDig') return 'Extra Dig Gems'
  return key
    .replace(/^crystal_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
