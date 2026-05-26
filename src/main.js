import Phaser from 'phaser'
import './style.css'
import { GAME_WIDTH, GAME_HEIGHT, physicsConfig } from './config.js'
import { TitleScene } from './scenes/TitleScene.js'
import { BootScene } from './scenes/BootScene.js'
import { GameScene } from './scenes/GameScene.js'
import { CaveScene } from './scenes/CaveScene.js'
import { HomeScene } from './scenes/HomeScene.js'

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'app',
  backgroundColor: '#1c1917',
  physics: physicsConfig,
  scene: [TitleScene, BootScene, GameScene, CaveScene, HomeScene],
})
