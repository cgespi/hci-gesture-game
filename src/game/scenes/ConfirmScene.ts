import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, RegistryKey} from '../constants.ts'

export class ConfirmScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Confirm })
  }

  create() {
        //auto set easy difficulty if no difficulty set
        if (!this.registry.has('difficulty')){
            this.registry.set(RegistryKey.Difficulty, 'Easy')
            this.registry.set(RegistryKey.BallSpeed, 1) //arbitrary values for now. 1 = easy, 2 = medium, 3 = hard
            this.registry.set(RegistryKey.LaunchDelay, 2.0) //seconds, 2 = easy, 1 = medium, 0.5 = hard
            this.registry.set(RegistryKey.StreakThreshhold, 8) //higher value means slower difficulty growth, 8 = easy, 4 = medium, 2 = hard
            this.registry.set(RegistryKey.GrowthSpeed, 0.1) //higher value means higher difficulty growth
            this.registry.set(RegistryKey.EndlessMode, false) //higher value means higher difficulty growth
        }

         this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'Confirm Page', {
                fontSize: '36px',
                color: '#eeeeff',
            })
            .setOrigin(0.5)

        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40 , this.registry.get('difficulty') + ' difficulty', {
                fontSize: '20px',
                color: '#ffe448',
            })
            .setOrigin(0.5)

        this.add 
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2  , this.registry.get('growthSpeed')*100 + '% difficulty increase per hitstreak cycle' , {
                fontSize: '15px',
                color: '#487cff',
            })
            .setOrigin(0.5)

        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50 , 'Endless Mode: ' + this.registry.get('endlessMode'), {
                fontSize: '20px',
                color: '#a0a0a0',
            })
            .setOrigin(0.5)


        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, 'Edit Settings', {
                fontSize: '20px',
                color: '#eeeeff',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.start(SceneKey.Settings)
            })
            .setOrigin(0.5)

        this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2 + 200, 'Start',{
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
