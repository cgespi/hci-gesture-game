import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../constants.ts'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Menu })
  }

  create() {
    // dark panel background
    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.6)
    panel.fillRoundedRect(GAME_WIDTH/2 - 220, GAME_HEIGHT/2 - 120, 440, 260, 16)
    panel.lineStyle(2, 0xffffff, 0.1)
    panel.strokeRoundedRect(GAME_WIDTH/2 - 220, GAME_HEIGHT/2 - 120, 440, 260, 16)

    // title text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'HCI Gesture Game', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2, '▶  Play', 'btn-green', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      this.scene.start(SceneKey.Confirm)
    })

    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 70, '⚙  Settings', 'btn-blue', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      this.scene.start(SceneKey.Settings)
    })
  }

  private makeButton(x: number, y: number, label: string, key: string, onClick: () => void) {
    const btnW = 260
    const btnH = 50
    const btn = this.add.nineslice(x, y, key, undefined, btnW, btnH, 8, 8, 8, 8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    const text = this.add.text(x, y, label, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1)

    btn.on('pointerover', () => { btn.setScale(1.05); text.setScale(1.05) })
    btn.on('pointerout',  () => { btn.setScale(1.0);  text.setScale(1.0) })
    btn.on('pointerdown', onClick)
  }
}