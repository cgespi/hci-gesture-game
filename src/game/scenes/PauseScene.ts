import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, RegistryKey} from '../constants.ts'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Pause })
  }
  //literally just confirm scene but with some extra buttons
  create() {
        //auto set easy difficulty if no difficulty set
        if (!this.registry.has('difficulty')){
            this.registry.set(RegistryKey.Difficulty, 'Easy')
            this.registry.set(RegistryKey.BallSpeed, 1) //arbitrary values for now. 1 = easy, 2 = medium, 3 = hard
            this.registry.set(RegistryKey.LaunchDelay, 2.0) //seconds, 2 = easy, 1 = medium, 0.5 = hard
            this.registry.set(RegistryKey.StreakThreshhold, 8) //higher value means slower difficulty growth, 8 = easy, 4 = medium, 2 = hard
            this.registry.set(RegistryKey.GrowthSpeed, 0.1) //higher value means higher difficulty growth
        }

         this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'Pause', {
                fontSize: '36px',
                color: '#eeeeff',
            })
            .setOrigin(0.5)

          this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'Current Difficulty Settings', {
                fontSize: '20px',
                color: '#000000',
            })
            .setOrigin(0.5)

        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40 , this.registry.get('difficulty') + ' difficulty', {
                fontSize: '20px',
                color: '#000000',
            })
            .setOrigin(0.5)

        this.add 
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2  , this.registry.get('growthSpeed')*100 + '% difficulty increase per hitstreak cycle' , {
                fontSize: '15px',
                color: '#000000',
            })
            .setOrigin(0.5)


        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'Edit Settings (Will restart game)', {
                fontSize: '20px',
                color: '#eeeeff',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.start(SceneKey.Settings)
            })
            .setOrigin(0.5)

        this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2 + 120, 'Resume Game',{
                fontSize: '20px',
                color: '#eeeeff',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.resume(SceneKey.UI)
                this.scene.resume(SceneKey.Game)
                this.scene.stop()
            })
            .setOrigin(0.5)
  }
}
