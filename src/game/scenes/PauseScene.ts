import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, RegistryKey, MusicRef} from '../constants.ts'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Pause })
  }
  //literally just confirm scene but with some extra buttons
  create() {
         this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'Pause', {
                fontSize: '36px',
                color: '#eeeeff',
            })
            .setOrigin(0.5)

          this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, 'Current Difficulty Settings', {
                fontSize: '25px',
                color: '#000000',
            })
            .setOrigin(0.5)

        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80 , this.registry.get('difficulty') + ' difficulty', {
                fontSize: '20px',
                color: '#000000',
            })
            .setOrigin(0.5)

        this.add 
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 -40 , this.registry.get('growthSpeed')*100 + '% difficulty increase per hitstreak cycle' , {
                fontSize: '15px',
                color: '#000000',
            })
            .setOrigin(0.5)


        this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 , 'Endless Mode: ' + this.registry.get('endlessMode'), {
              fontSize: '20px',
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
                if (MusicRef.music){
                    MusicRef.music.resume()
                }
                this.scene.resume(SceneKey.UI)
                this.scene.resume(SceneKey.Game)
                this.scene.stop()
            })
            .setOrigin(0.5)
        this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2 + 200, 'End Game',{
                fontSize: '20px',
                color: '#ff0000',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.scene.start(SceneKey.Menu)
                this.scene.stop(SceneKey.Game)
                this.scene.stop(SceneKey.UI)
                this.scene.stop(SceneKey.Pause)
            })
            .setOrigin(0.5)
  }
}
