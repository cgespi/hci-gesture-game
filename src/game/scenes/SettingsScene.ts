import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, RegistryKey } from '../constants.ts'

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Settings })
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

    // dark panel can change 
    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a1a, 0.92)
    panel.fillRoundedRect(GAME_WIDTH/2 - 260, GAME_HEIGHT/2 - 240, 520, 480, 16)
    panel.lineStyle(2, 0xffffff, 0.15)
    panel.strokeRoundedRect(GAME_WIDTH/2 - 260, GAME_HEIGHT/2 - 240, 520, 480, 16)

    //title 
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 205, '⚙  Settings', {
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5)

    // Divider
    const line1 = this.add.graphics()
    line1.lineStyle(1, 0xffffff, 0.2)
    line1.beginPath()
    line1.moveTo(GAME_WIDTH/2 - 210, GAME_HEIGHT/2 - 168)
    line1.lineTo(GAME_WIDTH/2 + 210, GAME_HEIGHT/2 - 168)
    line1.strokePath()

    // difficulty label 
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 148, 'Difficulty', {
      fontSize: '16px', color: '#aaaacc',
    }).setOrigin(0.5)

    const easyButton = this.add
      .text(GAME_WIDTH/2 - 110, GAME_HEIGHT/2 - 112, 'Easy', {
        fontSize: '20px', color: '#2ecc71', fontStyle: 'bold',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.sound.play('menu_click', { volume: 0.5 })
        this.registry.set(RegistryKey.Difficulty, 'Easy')
        this.registry.set(RegistryKey.BallSpeed, 1)
        this.registry.set(RegistryKey.LaunchDelay, 2.0)
        this.registry.set(RegistryKey.StreakThreshhold, 8)
        easyButton.setFontSize('26px')
        mediumButton.setFontSize('20px')
        hardButton.setFontSize('20px')
      })
      .setOrigin(0.5)

    const mediumButton = this.add
      .text(GAME_WIDTH/2, GAME_HEIGHT/2 - 112, 'Medium', {
        fontSize: '20px', color: '#f1c40f', fontStyle: 'bold',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.sound.play('menu_click', { volume: 0.5 })
        this.registry.set(RegistryKey.Difficulty, 'Medium')
        this.registry.set(RegistryKey.BallSpeed, 2)
        this.registry.set(RegistryKey.LaunchDelay, 1.0)
        this.registry.set(RegistryKey.StreakThreshhold, 4)
        easyButton.setFontSize('20px')
        mediumButton.setFontSize('26px')
        hardButton.setFontSize('20px')
      })
      .setOrigin(0.5)

    const hardButton = this.add
      .text(GAME_WIDTH/2 + 110, GAME_HEIGHT/2 - 112, 'Hard', {
        fontSize: '20px', color: '#e74c3c', fontStyle: 'bold',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.sound.play('menu_click', { volume: 0.5 })
        this.registry.set(RegistryKey.Difficulty, 'Hard')
        this.registry.set(RegistryKey.BallSpeed, 3)
        this.registry.set(RegistryKey.LaunchDelay, 0.5)
        this.registry.set(RegistryKey.StreakThreshhold, 2)
        easyButton.setFontSize('20px')
        mediumButton.setFontSize('20px')
        hardButton.setFontSize('26px')
      })
      .setOrigin(0.5)

    //set initial selected difficulty size
    const currentDiff = this.registry.get('difficulty')
    if (currentDiff === 'Easy') easyButton.setFontSize('26px')
    else if (currentDiff === 'Medium') mediumButton.setFontSize('26px')
    else hardButton.setFontSize('26px')

    // growth speed label + slider 
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 68, 'Growth Speed (0% – 45%)', {
      fontSize: '16px', color: '#aaaacc',
    }).setOrigin(0.5)

    const maxGrowthSpeed = 0.45
    const sliderTrack = this.add.graphics()
    sliderTrack.fillStyle(0x444466, 1)
    sliderTrack.fillRoundedRect(GAME_WIDTH/2 - 100, GAME_HEIGHT/2 - 48, 200, 6, 3)

    const widget = this.add.graphics()
    widget.fillStyle(0xffffff, 1)
    const currentGrowthSpeed = Phaser.Math.Clamp(
      this.registry.get(RegistryKey.GrowthSpeed) as number, 0, maxGrowthSpeed
    )
    widget.x = ((currentGrowthSpeed / maxGrowthSpeed) * 200) + (GAME_WIDTH/2 - 100)
    widget.y = GAME_HEIGHT/2 - 45
    widget.fillCircle(0, 0, 10)
    widget.setInteractive(new Phaser.Geom.Circle(0, 0, 10), Phaser.Geom.Circle.Contains)

    const widgetInput = widget.input
    if (widgetInput) { widgetInput.draggable = true; widgetInput.cursor = 'pointer' }
    this.input.setDraggable(widget)

    widget.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const sliderLeft = GAME_WIDTH/2 - 100
      const sliderRight = GAME_WIDTH/2 + 100
      const sliderValue = Phaser.Math.Clamp(dragX, sliderLeft, sliderRight)
      widget.x = sliderValue
      const normalized = (sliderValue - sliderLeft) / 200
      this.registry.set(RegistryKey.GrowthSpeed, normalized * maxGrowthSpeed)
    })

    //divider
    const line2 = this.add.graphics()
    line2.lineStyle(1, 0xffffff, 0.2)
    line2.beginPath()
    line2.moveTo(GAME_WIDTH/2 - 210, GAME_HEIGHT/2 - 18)
    line2.lineTo(GAME_WIDTH/2 + 210, GAME_HEIGHT/2 - 18)
    line2.strokePath()

    // endless mode toggle button 
    const isEndless = this.registry.get('endlessMode')
    const endlessBtn = this.add.nineslice(
      GAME_WIDTH/2, GAME_HEIGHT/2 + 40,
      isEndless ? 'btn-green' : 'btn-grey',
      undefined, 280, 50, 8, 8, 8, 8
    ).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const endlessText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 40,
      'Endless Mode: ' + (isEndless ? 'ON' : 'OFF'), {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1)

    endlessBtn.on('pointerover', () => endlessBtn.setScale(1.05))
    endlessBtn.on('pointerout',  () => endlessBtn.setScale(1.0))
    endlessBtn.on('pointerdown', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      const current = this.registry.get(RegistryKey.EndlessMode)
      this.registry.set(RegistryKey.EndlessMode, !current)
      const nowOn = !current
      endlessText.setText('Endless Mode: ' + (nowOn ? 'ON' : 'OFF'))
      endlessBtn.setTexture(nowOn ? 'btn-green' : 'btn-grey')
    })

    // music toggle button
    const isMusicOn = this.registry.get(RegistryKey.MusicToggle)
    const musicBtn = this.add.nineslice(
      GAME_WIDTH/2, GAME_HEIGHT/2 + 120,
      isMusicOn ? 'btn-green' : 'btn-red',
      undefined, 280, 50, 8, 8, 8, 8
    ).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const musicText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 120,
      'Music: ' + (isMusicOn ? 'ON' : 'OFF'), {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1)

    musicBtn.on('pointerover', () => musicBtn.setScale(1.05))
    musicBtn.on('pointerout',  () => musicBtn.setScale(1.0))
    musicBtn.on('pointerdown', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      const current = this.registry.get(RegistryKey.MusicToggle)
      this.registry.set(RegistryKey.MusicToggle, !current)
      const nowOn = !current
      musicText.setText('Music: ' + (nowOn ? 'ON' : 'OFF'))
      musicBtn.setTexture(nowOn ? 'btn-green' : 'btn-red')
    })

    // confirm button 
    this.makeButton(GAME_WIDTH/2, GAME_HEIGHT/2 + 190, '✔  Confirm', 'btn-green', () => {
      this.sound.play('menu_click', { volume: 0.5 })
      if (this.scene.isPaused(SceneKey.Game)) {
        this.scene.stop(SceneKey.UI)
        this.scene.stop(SceneKey.Game)
        this.scene.start(SceneKey.Game)
        return
      }
      this.scene.start(SceneKey.Confirm)
    })
  }

  private makeButton(x: number, y: number, label: string, key: string, onClick: () => void) {
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
