import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from './constants.ts'
import { BootScene } from './scenes/BootScene.ts'
import { GameScene } from './scenes/GameScene.ts'
import { MenuScene } from './scenes/MenuScene.ts'
import { UIScene } from './scenes/UIScene.ts'
import { ConfirmScene } from './scenes/ConfirmScene.ts'
import { SettingsScene } from './scenes/SettingsScene.ts'


/**
 * Central Phaser settings: size, colors, scaling, physics, and which scenes to register.
 */
export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'app',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MenuScene, GameScene, UIScene, ConfirmScene, SettingsScene],
  }
}
