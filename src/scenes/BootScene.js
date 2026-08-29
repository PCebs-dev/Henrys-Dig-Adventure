import Phaser from 'phaser'
import { createInitialGameState } from '../gameState.js'
import { Sfx } from '../audio/Sfx.js'
import { preloadMiner, createMinerAnimations } from '../characters/miner.js'
import { preloadTreasureAssets, setupTreasureIcons } from '../treasure/treasureAssets.js'
import { registerCrystalFrames } from '../treasure/crystalFrames.js'
import { preloadMapAssets } from '../worlds/mapAssets.js'
import { preloadBatAssets, createBatAnimations } from '../enemies/batAssets.js'
import { preloadDragonAssets, createDragonAnimations } from '../enemies/dragonAssets.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  init(data) {
    this.registry.set('gameState', data.gameState ?? createInitialGameState())
    this.registry.set('sfx', data.sfx ?? new Sfx())
  }

  preload() {
    preloadMiner(this)
    preloadTreasureAssets(this)
    preloadMapAssets(this)
    preloadBatAssets(this)
    preloadDragonAssets(this)
  }

  create() {
    registerCrystalFrames(this)
    setupTreasureIcons(this)
    createMinerAnimations(this)
    createBatAnimations(this)
    createDragonAnimations(this)
    this.cameras.main.fadeIn(400, 0, 0, 0)
    this.scene.start('GameScene', {
      gameState: this.registry.get('gameState'),
      sfx: this.registry.get('sfx'),
      mapSeed: Date.now(),
    })
  }
}
