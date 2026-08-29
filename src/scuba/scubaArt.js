import Phaser from 'phaser'

export function createScubaTextures(scene) {
  if (scene.textures.exists('scuba-diver')) return

  const g = scene.make.graphics({ x: 0, y: 0, add: false })
  g.fillStyle(0xfbbf24, 1)
  g.fillCircle(16, 10, 9)
  g.fillStyle(0x38bdf8, 0.5)
  g.fillCircle(16, 10, 7)
  g.fillStyle(0x1e3a8a, 1)
  g.fillRoundedRect(8, 18, 16, 18, 4)
  g.fillStyle(0x0ea5e9, 1)
  g.fillRect(4, 22, 6, 10)
  g.fillRect(22, 22, 6, 10)
  g.lineStyle(2, 0xfde047, 1)
  g.strokeCircle(16, 10, 9)
  g.generateTexture('scuba-diver', 32, 40)
  g.destroy()

  const bubble = scene.make.graphics({ x: 0, y: 0, add: false })
  bubble.lineStyle(2, 0xffffff, 0.6)
  bubble.strokeCircle(4, 4, 3)
  bubble.generateTexture('scuba-bubble', 8, 8)
  bubble.destroy()
}

export function spawnScubaBubbles(scene, x, y) {
  for (let i = 0; i < 3; i++) {
    const b = scene.add
      .image(x + Phaser.Math.Between(-8, 8), y, 'scuba-bubble')
      .setAlpha(0.5)
      .setDepth(y + 50)
    scene.tweens.add({
      targets: b,
      y: y - 40 - i * 10,
      alpha: 0,
      duration: 900 + i * 200,
      onComplete: () => b.destroy(),
    })
  }
}
