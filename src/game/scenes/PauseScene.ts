import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, MusicRef } from '../constants.ts'

/**
 * We pause active gameplay scenes and show a modal-style menu with resume/settings/end actions.
 */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Pause })
  }

  create() {
    // We render a darkened overlay so pause controls read as a foreground modal.
    // full screen dark overlay
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45).setOrigin(0, 0)

    // panel
    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a1a, 0.92)
    panel.fillRoundedRect(GAME_WIDTH/2 - 250, GAME_HEIGHT/2 - 220, 500, 440, 16)
    panel.lineStyle(2, 0xffffff, 0.15)
    panel.strokeRoundedRect(GAME_WIDTH/2 - 250, GAME_HEIGHT/2 - 220, 500, 440, 16)

    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 185, '⏸  PAUSED', {
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5)

    // Divider
    const line = this.add.graphics()
    line.lineStyle(1, 0xffffff, 0.2)
    line.beginPath()
    line.moveTo(GAME_WIDTH/2 - 200, GAME_HEIGHT/2 - 148)
    line.lineTo(GAME_WIDTH/2 + 200, GAME_HEIGHT/2 - 148)
    line.strokePath()

    // We mirror key settings so the player can verify current run parameters at a glance.
    // info text
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 120, 'Current Settings', {
      fontSize: '16px', color: '#aaaacc',
    }).setOrigin(0.5)

    const diff = this.registry.get('difficulty')
    const diffColor = diff === 'Easy' ? '#2ecc71' : diff === 'Medium' ? '#f1c40f' : '#e74c3c'
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 90, diff + ' Difficulty', {
      fontSize: '20px', color: diffColor, fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 60,
      this.registry.get('growthSpeed') * 100 + '% growth per streak', {
      fontSize: '14px', color: '#aaaacc',
    }).setOrigin(0.5)

    const endlessColor = this.registry.get('endlessMode') ? '#2ecc71' : '#e74c3c'
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 40,
      'Endless: ' + (this.registry.get('endlessMode') ? 'ON' : 'OFF'), {
      fontSize: '15px', color: endlessColor,
    }).setOrigin(0.5)

    const movingCannonColor = this.registry.get('movingCannon') ? '#2ecc71' : '#e74c3c'
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 20,
      'Moving Cannon: ' + (this.registry.get('movingCannon') ? 'ON' : 'OFF'), {
      fontSize: '16px', color: movingCannonColor,
    }).setOrigin(0.5)


    // Pause actions.
    // buttons
    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 20, '▶  Resume Game', 'btn-green', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      if (MusicRef.music) {
        MusicRef.music.resume()
      }
      this.scene.resume(SceneKey.UI)
      this.scene.resume(SceneKey.Game)
      this.scene.stop()
    })

    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 90, '⚙  Edit Settings', 'btn-blue', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      this.scene.start(SceneKey.Settings)
    })

    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 160, '✕  End Game', 'btn-red', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      this.scene.start(SceneKey.Menu)
      this.scene.stop(SceneKey.Game)
      this.scene.stop(SceneKey.UI)
      this.scene.stop(SceneKey.Pause)
    })
  }

  private makeButton(x: number, y: number, label: string, key: string, onClick: () => void) {
    // Shared button construction keeps interaction styling consistent with other menus.
    const btn = this.add.nineslice(x, y, key, undefined, 280, 50, 8, 8, 8, 8)
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
