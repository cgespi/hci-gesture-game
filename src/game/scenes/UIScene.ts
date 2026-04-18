import Phaser from 'phaser'
import { RegistryKey, SceneKey } from '../constants.ts'

/**
 * Heads-up display: score and other UI that should stay on top of {@link GameScene}.
 * Runs as a parallel scene (`launch`) so it does not replace the playfield.
 */
export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text
  private missesText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: SceneKey.UI })
  }

  create() {
    // Keep HUD aligned to the viewport even if the game camera moves later.
    this.cameras.main.setScroll(0, 0)

    const scoreInitial = this.registry.get(RegistryKey.Score)
    const scoreLabel = typeof scoreInitial === 'number' ? scoreInitial : 0

    const missesInitial = this.registry.get(RegistryKey.Misses)
    const missesLabel = typeof missesInitial === 'number' ? missesInitial : 0

    this.scoreText = this.add
      .text(20, 16, `Score: ${scoreLabel}`, {
        fontSize: '22px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    this.missesText = this.add
      .text(20, 44, `Misses: ${missesLabel} / 3`, {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    // GameScene updates the registry; we mirror the value into text.
    this.registry.events.on('changedata', this.onRegistryChanged, this)

    // Avoid duplicate listeners if this scene is restarted later in the same game instance.
    this.sys.events.once('shutdown', () => {
      this.registry.events.off('changedata', this.onRegistryChanged, this)
    })
  }

  private onRegistryChanged(_parent: object, key: string, value: unknown): void {
    if (typeof value !== 'number') return

    if (key === RegistryKey.Score) {
      this.scoreText.setText(`Score: ${value}`)
      return
    }

    if (key === RegistryKey.Misses) {
      this.missesText.setText(`Misses: ${value} / 3`)
    }
  }
}
