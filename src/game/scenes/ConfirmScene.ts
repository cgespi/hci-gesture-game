import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, RegistryKey } from '../constants.ts'

export class ConfirmScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Confirm })
  }

  create() {
    if (!this.registry.has('difficulty')) {
      this.registry.set(RegistryKey.Difficulty, 'Easy')
      this.registry.set(RegistryKey.BallSpeed, 1)
      this.registry.set(RegistryKey.LaunchDelay, 2.0)
      this.registry.set(RegistryKey.StreakThreshhold, 8)
      this.registry.set(RegistryKey.GrowthSpeed, 0.1)
      this.registry.set(RegistryKey.EndlessMode, false)
      this.registry.set(RegistryKey.MusicToggle, true)
    }

    // dark panel
    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.6)
    panel.fillRoundedRect(GAME_WIDTH/2 - 240, GAME_HEIGHT/2 - 160, 480, 360, 16)
    panel.lineStyle(2, 0xffffff, 0.1)
    panel.strokeRoundedRect(GAME_WIDTH/2 - 240, GAME_HEIGHT/2 - 160, 480, 360, 16)

    // title
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 130, 'Ready to Play?', {
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5)

    // difficulty label
    const diff = this.registry.get('difficulty')
    const diffColor = diff === 'Easy' ? '#2ecc71' : diff === 'Medium' ? '#f1c40f' : '#e74c3c'
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 80, diff + ' Difficulty', {
      fontSize: '22px', color: diffColor, fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 45,
      this.registry.get('growthSpeed') * 100 + '% difficulty growth per streak', {
      fontSize: '14px', color: '#aaaacc',
    }).setOrigin(0.5)

    const endlessColor = this.registry.get('endlessMode') ? '#2ecc71' : '#e74c3c'
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 15,
      'Endless Mode: ' + (this.registry.get('endlessMode') ? 'ON' : 'OFF'), {
      fontSize: '16px', color: endlessColor,
    }).setOrigin(0.5)

    // divider line
    const line = this.add.graphics()
    line.lineStyle(1, 0xffffff, 0.2)
    line.beginPath()
    line.moveTo(GAME_WIDTH/2 - 180, GAME_HEIGHT/2 + 20)
    line.lineTo(GAME_WIDTH/2 + 180, GAME_HEIGHT/2 + 20)
    line.strokePath()

    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 70, '▶  Start Game', 'btn-green', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      this.scene.start(SceneKey.Game)
    })

    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 140, '⚙  Edit Settings', 'btn-blue', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      this.scene.start(SceneKey.Settings)
    })
  }

  private makeButton(x: number, y: number, label: string, key: string, onClick: () => void) {
    const btn = this.add.nineslice(x, y, key, undefined, 260, 50, 8, 8, 8, 8)
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    const text = this.add.text(x, y, label, {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1)
    btn.on('pointerover', () => { btn.setScale(1.05); text.setScale(1.05) })
    btn.on('pointerout',  () => { btn.setScale(1.0);  text.setScale(1.0) })
    btn.on('pointerdown', onClick)
  }
}