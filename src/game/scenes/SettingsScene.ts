import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, RegistryKey } from '../constants.ts'

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Settings })
  }
  create() {
        if (!this.registry.has('difficulty')){
            this.registry.set(RegistryKey.Difficulty, 'Easy')
            this.registry.set(RegistryKey.BallSpeed, 1) //arbitrary values for now. 1 = easy, 2 = medium, 3 = hard
            this.registry.set(RegistryKey.LaunchDelay, 2.0) //seconds, 2 = easy, 1 = medium, 0.5 = hard
            this.registry.set(RegistryKey.StreakThreshhold, 8) //higher value means slower difficulty growth, 8 = easy, 4 = medium, 2 = hard
            this.registry.set(RegistryKey.GrowthSpeed, 0.1) //higher value means higher difficulty growth
        }
    
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'Settings', {
                fontSize: '36px',
                color: '#eeeeff',
            })
            .setOrigin(0.5)


        this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2-80, 'Difficulty',{
                fontSize: '20px',
                color: '#eeeeff',
            })
            .setOrigin(0.5)

        const easyButton = this.add
            .text(GAME_WIDTH/2-100, GAME_HEIGHT/2-60, 'Easy',{
                fontSize: '20px',
                color: '#00ff59',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.registry.set(RegistryKey.Difficulty, 'Easy')
                this.registry.set(RegistryKey.BallSpeed, 1)
                this.registry.set(RegistryKey.LaunchDelay, 2.0)
                this.registry.set(RegistryKey.StreakThreshhold, 8)
                easyButton.setFontSize('30px');
                mediumButton.setFontSize('20px');
                hardButton.setFontSize('20px');
            })
            .setOrigin(0.5)

        const mediumButton = this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2-60, 'Medium',{
                fontSize: '20px',
                color: '#d0f501',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.registry.set(RegistryKey.Difficulty, 'Medium')
                this.registry.set(RegistryKey.BallSpeed, 2)
                this.registry.set(RegistryKey.LaunchDelay, 1.0)
                this.registry.set(RegistryKey.StreakThreshhold, 4)
                easyButton.setFontSize('20px');
                mediumButton.setFontSize('30px');
                hardButton.setFontSize('20px');
            })
            .setOrigin(0.5)

        const hardButton = this.add
            .text(GAME_WIDTH/2 + 100, GAME_HEIGHT/2-60, 'Hard',{
                fontSize: '20px',
                color: '#ff0000',
            })
            .setInteractive({useHandCursor: true})
            .on('pointerdown',() => {
                this.registry.set(RegistryKey.Difficulty, 'Hard')
                this.registry.set(RegistryKey.BallSpeed, 3)
                this.registry.set(RegistryKey.LaunchDelay, 0.5)
                this.registry.set(RegistryKey.StreakThreshhold, 2)
                easyButton.setFontSize('20px');
                mediumButton.setFontSize('20px');
                hardButton.setFontSize('30px');
            })
            .setOrigin(0.5)


            //if difficulty not set, starts at easy difficulty at first, 0.1 growthspeed
        if (this.registry.has('difficulty')){
            if (this.registry.get('difficulty') == 'Easy'){
                easyButton.setFontSize('30px');
            } else if (this.registry.get('difficulty') == 'Medium'){
                mediumButton.setFontSize('30px');
            } else {
                hardButton.setFontSize('30px');
            }
        }

        this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2-20, 'Growth Speed',{
                fontSize: '20px',
                color: '#eeeeff',
            })  
            .setOrigin(0.5)
        //slider
        const slider = this.add.graphics();
        slider.fillStyle(0x666666, 1);
        slider.fillRect(300 , 300, 200, 5);
        
        const widget = this.add.graphics();
        widget.fillStyle(0xffffff, 1);
        widget.x = (this.registry.get('growthSpeed') * 200) + 300;
        widget.y = 303;
        widget.fillCircle(0, 0, 10);
        widget.setInteractive(  
            new Phaser.Geom.Circle(0, 0, 10),
            Phaser.Geom.Circle.Contains
        );
        widget.input.draggable = true;
        widget.input.cursor = "pointer";

        this.input.setDraggable(widget);

        widget.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            const sliderValue = Math.round(Phaser.Math.Clamp(dragX, 300, 500));
            widget.x = sliderValue;

            this.registry.set(RegistryKey.GrowthSpeed, (sliderValue - 300) / 200);
        });     

        this.add
            .text(GAME_WIDTH/2, GAME_HEIGHT/2+200, 'Confirm',{
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
