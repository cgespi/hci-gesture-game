import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../constants.ts'

export class ConfirmScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Confirm })
  }

  create() {
         this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Confirm Page', {
                fontSize: '36px',
                color: '#eeeeff',
            })
            .setOrigin(0.5)


        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'Edit Settings', {
                fontSize: '20px',
                color: '#eeeeff',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.start(SceneKey.Settings)
            })
            .setOrigin(0.5)

        this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2 + 80, 'Start',{
                fontSize: '20px',
                color: '#eeeeff',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.start(SceneKey.Game)
            })
            .setOrigin(0.5)
  }
}
