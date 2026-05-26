import Phaser from 'phaser'

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
  }

  create() {
    this.add
      .text(400, 300, 'MainScene is deprecated.\nStarting BootScene...', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)

    this.time.delayedCall(200, () => this.scene.start('BootScene'))
  }
}
