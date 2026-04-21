import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../constants.ts'

/**
 * Simple title screen. Starting the game swaps to {@link GameScene} (see `BootScene` flow).
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Menu })
  }

  create() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'HCI Gesture Game', {
        fontSize: '36px',
        color: '#eeeeff',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24, 'Play', {
        fontSize: '20px',
        color: '#aabbcc',
      })
      .setOrigin(0.5)
      .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.start(SceneKey.Confirm)
            })

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'Settings', {
        fontSize: '20px',
        color: '#aabbcc',
      })
      .setOrigin(0.5)
      .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.start(SceneKey.Settings)
            })

  }
}
