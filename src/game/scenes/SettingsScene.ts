import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../constants.ts'

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Settings })
  }

  create() {
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Settings (none for now)', {
                fontSize: '36px',
                color: '#eeeeff',
            })
            .setOrigin(0.5)

        this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2+40, 'Confirm',{
                fontSize: '20px',
                color: '#eeeeff',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.start(SceneKey.Confirm)
            })
            .setOrigin(0.5)
  }
}
