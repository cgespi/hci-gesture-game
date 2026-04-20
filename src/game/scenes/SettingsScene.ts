import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../constants'

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Settings })
  }

  create() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, 'This is the Settings menu', {
        fontSize: '28px',
        color: '#eeeeff',
      })
      .setOrigin(0.5)

    const back = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, 'Back', {
        fontSize: '20px',
        color: '#aabbcc',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    back.on('pointerdown', () => {
      this.scene.start(SceneKey.Menu)
    })
  }
}

