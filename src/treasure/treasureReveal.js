import { addGem, addScore, resetDigs } from '../gameState.js'
import { createCrystalSprite } from './crystalFrames.js'

function delay(scene, ms) {
  return new Promise((resolve) => {
    scene.time.delayedCall(ms, resolve)
  })
}

/** Fixed screen slots for 1–5 gems in an arc below the chest */
function gemSlots(count, cx, cy) {
  const slots = []
  if (count === 1) {
    slots.push({ x: cx, y: cy + 50 })
    return slots
  }
  const spread = Math.min(140, 50 + count * 22)
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    slots.push({
      x: cx - spread / 2 + t * spread,
      y: cy + 45 + (i % 2) * 12,
    })
  }
  return slots
}

/**
 * Full-screen treasure moment: chest open (1s hold), then gems pop out (2s hold).
 */
export async function playTreasureReveal(scene, { chest, sfx, state }) {
  scene.revealActive = true
  scene.input.enabled = false
  if (scene.player?.body) scene.player.body.setVelocity(0, 0)
  if (scene.hud) scene.hud.setLogOpen(false)

  const cam = scene.cameras.main
  const cx = cam.centerX
  const cy = cam.centerY

  const overlay = scene.add
    .rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.6)
    .setScrollFactor(0)
    .setDepth(2000)

  const title = scene.add
    .text(cx, cy - 120, 'TREASURE CHEST!', {
      fontFamily: 'system-ui, Segoe UI, sans-serif',
      fontSize: '28px',
      color: '#fde047',
      stroke: '#000000',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(2001)

  const chestSprite = scene.add
    .image(cx, cy, 'chest-layer-1')
    .setScrollFactor(0)
    .setDepth(2002)
    .setScale(3)

  scene.cameras.main.shake(150, 0.008)
  sfx.chestFound()

  for (let i = 1; i <= 8; i++) {
    chestSprite.setTexture(`chest-layer-${i}`)
    await delay(scene, 70)
  }

  await delay(scene, 1000)

  const toDestroy = []
  const hasGems = chest.items.length > 0

  if (hasGems) {
    sfx.gemsCelebration()
    const slots = gemSlots(chest.items.length, cx, cy)

    for (let i = 0; i < chest.items.length; i++) {
      const item = chest.items[i]
      addGem(state, item.key, 1)
      addScore(state, item.points)

      const slot = slots[i]
      const gem = createCrystalSprite(scene, slot.x, slot.y, item.frame, 56)
        .setScrollFactor(0)
        .setDepth(2003)
        .setAlpha(0)

      scene.tweens.add({
        targets: gem,
        alpha: 1,
        y: slot.y - 8,
        duration: 350,
        ease: 'Back.easeOut',
      })

      const label = scene.add
        .text(slot.x, slot.y + 38, `+${item.points} ${item.label}`, {
          fontFamily: 'system-ui, Segoe UI, sans-serif',
          fontSize: '14px',
          color: '#a7f3d0',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(2004)
        .setAlpha(0)

      scene.tweens.add({
        targets: label,
        alpha: 1,
        duration: 300,
        delay: 200,
      })

      toDestroy.push(gem, label)
    }

    await delay(scene, 2000)
  }

  if (chest.hasExtraDig) {
    addGem(state, 'extraDig', 1)
    resetDigs(state)
    const bonus = scene.add
      .text(cx, cy + 130, 'EXTRA DIGS! Back to 25!', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#60a5fa',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2005)
    toDestroy.push(bonus)
    await delay(scene, 800)
  }

  title.destroy()
  chestSprite.destroy()
  toDestroy.forEach((s) => s.destroy())
  overlay.destroy()

  scene.revealActive = false
  scene.input.enabled = true
  if (scene.hud) scene.hud.update()
}

export function goHomeIfNoDigs(scene) {
  if (scene.state.digsLeft <= 0) {
    scene.time.delayedCall(400, () => {
      scene.scene.start('HomeScene', {
        gameState: scene.state,
        sfx: scene.sfx,
      })
    })
    return true
  }
  return false
}
