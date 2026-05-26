import idleFront from '../assets/Sprites/Character/idle-front.png'
import idleBack from '../assets/Sprites/Character/idle-back.png'
import idleLeft from '../assets/Sprites/Character/idle-left.png'
import idleRight from '../assets/Sprites/Character/idle-right.png'
import walkFront from '../assets/Sprites/Character/walk-front.png'
import walkBack from '../assets/Sprites/Character/walk-back.png'
import walkLeft from '../assets/Sprites/Character/walk-left.png'
import walkRight from '../assets/Sprites/Character/walk-right.png'
import digFront from '../assets/Sprites/Character/take-off-front.png'

const FRAME = { frameWidth: 32, frameHeight: 32 }
const DIRECTIONS = ['front', 'back', 'left', 'right']

const SHEETS = [
  ['miner-idle-front', idleFront],
  ['miner-idle-back', idleBack],
  ['miner-idle-left', idleLeft],
  ['miner-idle-right', idleRight],
  ['miner-walk-front', walkFront],
  ['miner-walk-back', walkBack],
  ['miner-walk-left', walkLeft],
  ['miner-walk-right', walkRight],
  ['miner-dig-front', digFront],
]

export function preloadMiner(scene) {
  for (const [key, url] of SHEETS) {
    scene.load.spritesheet(key, url, FRAME)
  }
}

export function createMinerAnimations(scene) {
  if (scene.registry.get('minerAnimsReady')) return

  for (const dir of DIRECTIONS) {
    scene.anims.create({
      key: `miner-idle-${dir}`,
      frames: scene.anims.generateFrameNumbers(`miner-idle-${dir}`, { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    })
    scene.anims.create({
      key: `miner-walk-${dir}`,
      frames: scene.anims.generateFrameNumbers(`miner-walk-${dir}`, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    })
  }

  scene.anims.create({
    key: 'miner-dig-front',
    frames: scene.anims.generateFrameNumbers('miner-dig-front', { start: 0, end: 1 }),
    frameRate: 8,
    repeat: 0,
  })

  scene.registry.set('minerAnimsReady', true)
}

export function spawnMiner(scene, x, y) {
  const player = scene.physics.add.sprite(x, y, 'miner-idle-front', 0)
  player.setScale(2)
  player.setDepth(10)
  player.body.setSize(16, 10)
  player.body.setOffset(8, 20)
  player.setCollideWorldBounds(true)
  player.minerFacing = 'front'
  player.play('miner-idle-front')
  return player
}

export function facingFromVelocity(vx, vy) {
  if (Math.abs(vx) >= Math.abs(vy)) {
    return vx < 0 ? 'left' : 'right'
  }
  return vy < 0 ? 'back' : 'front'
}

export function updateMinerMovementAnimation(player, vx, vy) {
  const moving = Math.hypot(vx, vy) > 8
  if (moving) {
    player.minerFacing = facingFromVelocity(vx, vy)
    const key = `miner-walk-${player.minerFacing}`
    if (player.anims.currentAnim?.key !== key) player.play(key, true)
    return
  }

  const key = `miner-idle-${player.minerFacing}`
  if (player.anims.currentAnim?.key !== key) player.play(key, true)
}

export function playMinerDigAnimation(player) {
  if (player.minerFacing === 'front') {
    player.play('miner-dig-front')
    return
  }
  player.play(`miner-idle-${player.minerFacing}`)
}

export function playMinerIdleAnimation(player) {
  player.play(`miner-idle-${player.minerFacing}`)
}
