import Phaser from 'phaser'
import { RegistryKey, SceneKey } from '../constants.ts'

/**
 * Heads-up display: score and other UI that should stay on top of {@link GameScene}.
 * Runs as a parallel scene (`launch`) so it does not replace the playfield.
 */
export class UIScene extends Phaser.Scene {
  private hitsText!: Phaser.GameObjects.Text
  private missesText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text
  private laneText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: SceneKey.UI })
  }

  create() {
    // Keep HUD aligned to the viewport even if the game camera moves later.
    this.cameras.main.setScroll(0, 0)

    const hitsInitial = this.registry.get(RegistryKey.Hits)
    const hitsLabel = typeof hitsInitial === 'number' ? hitsInitial : 0

    const missesInitial = this.registry.get(RegistryKey.Misses)
    const missesLabel = typeof missesInitial === 'number' ? missesInitial : 0

    const livesInitial = this.registry.get(RegistryKey.Lives)
    const livesLabel = typeof livesInitial === 'number' ? livesInitial : 0

    const laneInitial = this.registry.get(RegistryKey.TargetLane)
    const laneLabel = typeof laneInitial === 'string' ? laneInitial : '—'

    this.hitsText = this.add
      .text(20, 16, `Hits: ${hitsLabel}`, {
        fontSize: '22px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    this.missesText = this.add
      .text(20, 44, `Misses: ${missesLabel}`, {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    this.livesText = this.add
      .text(20, 68, `Lives: ${livesLabel}`, {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(1000)

    this.laneText = this.add
      .text(20, 92, `Direction: ${laneLabel}`, {
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
    if (key === RegistryKey.TargetLane) {
      if (typeof value !== 'string') return
      this.laneText.setText(`Direction: ${value}`)
      return
    }

    if (typeof value !== 'number') return

    if (key === RegistryKey.Hits) {
      this.hitsText.setText(`Hits: ${value}`)
      return
    }

    if (key === RegistryKey.Misses) {
      this.missesText.setText(`Misses: ${value}`)
      return
    }

    if (key === RegistryKey.Lives) {
      this.livesText.setText(`Lives: ${value}`)
    }
  }
}
