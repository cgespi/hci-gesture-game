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

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24, 'Press SPACE or click to play', {
        fontSize: '20px',
        color: '#aabbcc',
      })
      .setOrigin(0.5)

    const startGame = () => {
      hint.setColor('#8899aa')
      this.scene.start(SceneKey.Game)
    }

    this.input.keyboard!.once('keydown-SPACE', startGame)
    this.input.once('pointerdown', startGame)
  }
}
