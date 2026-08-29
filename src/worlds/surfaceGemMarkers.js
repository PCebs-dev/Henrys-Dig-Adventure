import { createCrystalSprite } from '../treasure/crystalFrames.js'

export function spawnSurfaceGemMarkers(scene, { surfaceGems = [], tileSize }) {
  const markers = []

  for (const gem of surfaceGems) {
    const x = gem.col * tileSize + tileSize / 2
    const y = gem.row * tileSize + tileSize / 2 - 6
    const key = `${gem.col},${gem.row}`

    const sparkle = createCrystalSprite(scene, x, y, gem.frame ?? 0, 22)
      .setDepth(y + 20)
      .setAlpha(0.9)

    scene.tweens.add({
      targets: sparkle,
      y: y - 4,
      alpha: 0.55,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const hint = scene.add
      .circle(x, y + 10, 10, 0xfbbf24, 0.12)
      .setDepth(y + 19)
    scene.tweens.add({
      targets: hint,
      alpha: 0.35,
      scale: 1.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    })

    markers.push({ key, sparkle, hint })
  }

  return {
    remove(key) {
      const entry = markers.find((m) => m.key === key)
      if (!entry) return
      entry.sparkle?.destroy()
      entry.hint?.destroy()
    },
    destroy() {
      for (const entry of markers) {
        entry.sparkle?.destroy()
        entry.hint?.destroy()
      }
    },
  }
}
