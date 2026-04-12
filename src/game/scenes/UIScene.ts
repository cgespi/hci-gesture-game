import Phaser from 'phaser'
import { RegistryKey, SceneKey } from '../constants.ts'

/**
 * Heads-up display: score and other UI that should stay on top of {@link GameScene}.
 * Runs as a parallel scene (`launch`) so it does not replace the playfield.
 */
export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: SceneKey.UI })
  }

  create() {
    // Keep HUD aligned to the viewport even if the game camera moves later.
    this.cameras.main.setScroll(0, 0)

    const initial = this.registry.get(RegistryKey.Score)
    const label = typeof initial === 'number' ? initial : 0

    this.scoreText = this.add
      .text(20, 16, `Score: ${label}`, {
        fontSize: '22px',
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
    if (key !== RegistryKey.Score || typeof value !== 'number') return
    this.scoreText.setText(`Score: ${value}`)
  }
}
