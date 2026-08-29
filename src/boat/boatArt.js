import Phaser from 'phaser'

export function createBoatTextures(scene) {
  if (scene.textures.exists('boat-hull')) return

  const hull = scene.make.graphics({ x: 0, y: 0, add: false })
  hull.fillStyle(0x92400e, 1)
  hull.fillRoundedRect(8, 20, 144, 36, 8)
  hull.fillStyle(0xb45309, 1)
  hull.fillRoundedRect(12, 16, 136, 28, 6)
  hull.lineStyle(3, 0x78350f, 1)
  hull.strokeRoundedRect(8, 20, 144, 36, 8)
  hull.fillStyle(0x451a03, 1)
  for (let i = 0; i < 5; i++) {
    hull.fillRect(20 + i * 26, 24, 4, 24)
  }
  hull.generateTexture('boat-hull', 160, 60)
  hull.destroy()

  const pedal = scene.make.graphics({ x: 0, y: 0, add: false })
  pedal.fillStyle(0x78350f, 1)
  pedal.fillRoundedRect(0, 8, 36, 14, 4)
  pedal.fillStyle(0xa16207, 1)
  pedal.fillCircle(18, 8, 8)
  pedal.lineStyle(2, 0x451a03, 1)
  pedal.strokeRoundedRect(0, 8, 36, 14, 4)
  pedal.generateTexture('boat-pedal', 36, 24)
  pedal.destroy()

  const gun = scene.make.graphics({ x: 0, y: 0, add: false })
  gun.fillStyle(0x374151, 1)
  gun.fillRect(4, 10, 28, 10)
  gun.fillStyle(0x1f2937, 1)
  gun.fillRect(28, 12, 18, 6)
  gun.fillStyle(0x4b5563, 1)
  gun.fillRect(0, 6, 12, 18)
  gun.generateTexture('boat-gun', 48, 28)
  gun.destroy()

  const whale = scene.make.graphics({ x: 0, y: 0, add: false })
  whale.fillStyle(0x0a0a0a, 1)
  whale.fillEllipse(40, 26, 76, 36)
  whale.fillStyle(0x1e1b4b, 1)
  whale.fillEllipse(40, 24, 68, 30)
  whale.fillStyle(0x312e81, 0.6)
  whale.fillEllipse(48, 22, 24, 14)
  whale.fillStyle(0x450a0a, 1)
  whale.fillCircle(66, 20, 7)
  whale.fillStyle(0xff0000, 1)
  whale.fillCircle(66, 20, 5)
  whale.fillStyle(0xff6666, 0.9)
  whale.fillCircle(64, 18, 2)
  whale.fillStyle(0x7f1d1d, 1)
  whale.fillTriangle(58, 28, 54, 32, 62, 32)
  whale.fillTriangle(64, 28, 60, 32, 68, 32)
  whale.fillStyle(0xf5f5f4, 1)
  whale.fillTriangle(58, 28, 56, 31, 60, 31)
  whale.fillTriangle(64, 28, 62, 31, 66, 31)
  whale.fillStyle(0x000000, 1)
  whale.fillTriangle(6, 26, 0, 14, 0, 38)
  whale.lineStyle(2, 0x450a0a, 0.8)
  whale.lineBetween(20, 18, 34, 22)
  whale.lineBetween(20, 30, 34, 26)
  whale.generateTexture('whale', 80, 52)
  whale.destroy()

  const bullet = scene.make.graphics({ x: 0, y: 0, add: false })
  bullet.fillStyle(0xfbbf24, 1)
  bullet.fillCircle(4, 4, 4)
  bullet.generateTexture('boat-bullet', 8, 8)
  bullet.destroy()

  const enemyBullet = scene.make.graphics({ x: 0, y: 0, add: false })
  enemyBullet.fillStyle(0xef4444, 1)
  enemyBullet.fillCircle(5, 5, 5)
  enemyBullet.fillStyle(0xfca5a5, 0.9)
  enemyBullet.fillCircle(4, 4, 2)
  enemyBullet.generateTexture('enemy-bullet', 10, 10)
  enemyBullet.destroy()

  const skull = scene.make.graphics({ x: 0, y: 0, add: false })
  skull.fillStyle(0xe5e7eb, 1)
  skull.fillCircle(16, 14, 12)
  skull.fillRect(8, 22, 16, 10)
  skull.fillStyle(0x111827, 1)
  skull.fillCircle(11, 13, 3)
  skull.fillCircle(21, 13, 3)
  skull.fillTriangle(13, 20, 16, 23, 19, 20)
  skull.fillStyle(0x22c55e, 1)
  skull.fillCircle(16, 8, 4)
  skull.fillStyle(0x84cc16, 0.9)
  skull.fillEllipse(16, 28, 14, 8)
  skull.fillStyle(0x4ade80, 0.85)
  skull.fillCircle(10, 30, 3)
  skull.fillCircle(22, 30, 3)
  skull.fillCircle(16, 32, 4)
  skull.fillStyle(0x166534, 0.8)
  skull.fillRect(14, 26, 4, 8)
  skull.generateTexture('poison-skull', 32, 36)
  skull.destroy()

  const sailor = scene.make.graphics({ x: 0, y: 0, add: false })
  sailor.fillStyle(0x1e3a8a, 1)
  sailor.fillRoundedRect(18, 34, 44, 14, 4)
  sailor.fillStyle(0xffffff, 1)
  sailor.fillRoundedRect(24, 14, 32, 24, 6)
  sailor.fillStyle(0xfbbf24, 1)
  sailor.fillTriangle(40, 0, 28, 14, 52, 14)
  sailor.fillStyle(0xfde68a, 1)
  sailor.fillRect(36, 0, 8, 6)
  sailor.fillStyle(0xfcd34d, 1)
  sailor.fillCircle(40, 22, 10)
  sailor.fillStyle(0x1e293b, 1)
  sailor.fillCircle(36, 21, 2)
  sailor.fillCircle(44, 21, 2)
  sailor.fillStyle(0xf87171, 1)
  sailor.fillEllipse(40, 27, 8, 4)
  sailor.fillStyle(0x1e40af, 1)
  sailor.fillRect(26, 36, 10, 10)
  sailor.fillRect(44, 36, 10, 10)
  sailor.fillStyle(0xffffff, 1)
  sailor.fillRect(28, 38, 6, 4)
  sailor.fillRect(46, 38, 6, 4)
  sailor.lineStyle(2, 0x1e3a8a, 1)
  sailor.strokeRoundedRect(18, 34, 44, 14, 4)
  sailor.generateTexture('sailor', 80, 52)
  sailor.destroy()
}

export function createBoatViewGraphics(scene) {
  return scene.add.graphics().setDepth(900).setScrollFactor(0)
}

export function redrawBoatView(rim, { width, height, boatX }) {
  const cx = boatX ?? width / 2
  rim.clear()
  rim.fillStyle(0x92400e, 0.95)
  rim.fillTriangle(cx - 180, height, cx - 120, height - 90, cx + 120, height - 90)
  rim.fillTriangle(cx + 180, height, cx + 120, height - 90, cx - 120, height - 90)
  rim.fillStyle(0xb45309, 1)
  rim.fillRect(0, height - 28, width, 28)
  rim.lineStyle(4, 0x78350f, 1)
  rim.lineBetween(0, height - 28, width, height - 28)
}

export function drawBoatView(scene, opts) {
  const rim = createBoatViewGraphics(scene)
  redrawBoatView(rim, opts)
  return rim
}

export function addScaryWhaleEyes(scene, whale) {
  const flip = whale.flipX ? -1 : 1
  const glow = scene.add
    .circle(whale.x + 26 * flip, whale.y - 4, 8, 0xff0000, 0.35)
    .setDepth(whale.depth + 1)
  scene.tweens.add({
    targets: glow,
    alpha: 0.15,
    scale: 1.4,
    duration: 400,
    yoyo: true,
    repeat: -1,
  })
  whale.scaryGlow = glow
  whale.on('destroy', () => glow.destroy())
}

export function playWhaleExplosion(scene, x, y, depth = 800) {
  const burst = scene.add.circle(x, y, 8, 0xff4500, 0.85).setDepth(depth + 2)
  scene.tweens.add({
    targets: burst,
    radius: 48,
    alpha: 0,
    duration: 320,
    ease: 'Quad.easeOut',
    onComplete: () => burst.destroy(),
  })

  const ring = scene.add.circle(x, y, 10, 0x000000, 0).setStrokeStyle(4, 0xfbbf24, 1).setDepth(depth + 2)
  scene.tweens.add({
    targets: ring,
    radius: 56,
    alpha: 0,
    duration: 400,
    onComplete: () => ring.destroy(),
  })

  const colors = [0x1e1b4b, 0x312e81, 0x450a0a, 0x7f1d1d, 0x22c55e]
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14
    const dist = Phaser.Math.Between(28, 52)
    const shard = scene.add
      .circle(x, y, Phaser.Math.Between(3, 6), colors[i % colors.length], 0.9)
      .setDepth(depth + 1)
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      duration: 380 + i * 12,
      ease: 'Quad.easeOut',
      onComplete: () => shard.destroy(),
    })
  }

  for (let i = 0; i < 6; i++) {
    const drop = scene.add
      .circle(x + Phaser.Math.Between(-12, 12), y + 8, Phaser.Math.Between(3, 5), 0x4ade80, 0.75)
      .setDepth(depth + 1)
    scene.tweens.add({
      targets: drop,
      y: y + Phaser.Math.Between(24, 48),
      alpha: 0,
      duration: 500 + i * 40,
      onComplete: () => drop.destroy(),
    })
  }
}

export function spawnPoisonSkull(scene, x, y, depth = 800) {
  const skull = scene.add
    .image(x, y, 'poison-skull')
    .setScale(0.5)
    .setDepth(depth + 3)
    .setAlpha(0)

  scene.tweens.add({
    targets: skull,
    alpha: 1,
    scale: 1.1,
    y: y - 18,
    duration: 280,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: skull,
        y: y + 20,
        alpha: 0,
        angle: Phaser.Math.Between(-20, 20),
        duration: 1200,
        ease: 'Sine.easeIn',
        onComplete: () => skull.destroy(),
      })
    },
  })

  const label = scene.add
    .text(x, y - 28, 'POISON!', {
      fontFamily: 'system-ui, Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#4ade80',
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(depth + 4)
    .setAlpha(0)

  scene.tweens.add({
    targets: label,
    alpha: 1,
    y: y - 42,
    duration: 200,
    onComplete: () => {
      scene.tweens.add({
        targets: label,
        alpha: 0,
        duration: 900,
        delay: 300,
        onComplete: () => label.destroy(),
      })
    },
  })

  return skull
}

export function addFishWave(scene, fish) {
  const baseY = fish.y
  scene.tweens.add({
    targets: fish,
    y: baseY + Phaser.Math.Between(-6, 6),
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })
}

export function playFishHitReaction(scene, x, y, depth = 800) {
  const burst = scene.add
    .text(x, y - 20, '😢', { fontSize: '28px' })
    .setOrigin(0.5)
    .setDepth(depth + 2)

  scene.tweens.add({
    targets: burst,
    y: y - 50,
    alpha: 0,
    duration: 700,
    onComplete: () => burst.destroy(),
  })

  const ring = scene.add
    .circle(x, y, 10, 0x60a5fa, 0.4)
    .setDepth(depth + 1)
  scene.tweens.add({
    targets: ring,
    radius: 36,
    alpha: 0,
    duration: 400,
    onComplete: () => ring.destroy(),
  })
}

export function setupSharkJump(scene, shark, surfaceY) {
  const jumpDelay = Phaser.Math.Between(800, 2200)
  const doJump = () => {
    if (!shark.active) return
    scene.tweens.add({
      targets: shark,
      y: surfaceY - Phaser.Math.Between(55, 85),
      duration: 420,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        if (shark.active) {
          scene.time.delayedCall(Phaser.Math.Between(1200, 2800), doJump)
        }
      },
    })
  }
  scene.time.delayedCall(jumpDelay, doJump)
}

export function showBlockShield(scene, x, y, visible) {
  if (!scene.blockShield) {
    scene.blockShield = scene.add
      .circle(x, y, 52, 0x60a5fa, 0.25)
      .setStrokeStyle(4, 0x93c5fd, 0.85)
      .setDepth(880)
      .setScrollFactor(0)
  }
  scene.blockShield.setPosition(x, y)
  scene.blockShield.setVisible(visible)
  if (visible) {
    scene.tweens.add({
      targets: scene.blockShield,
      scale: 1.08,
      alpha: 0.45,
      duration: 120,
      yoyo: true,
    })
  }
}
