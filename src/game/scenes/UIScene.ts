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
  this.cameras.main.setScroll(0, 0)

  const hitsInitial = this.registry.get(RegistryKey.Hits)
  const hitsLabel = typeof hitsInitial === 'number' ? hitsInitial : 0

  const missesInitial = this.registry.get(RegistryKey.Misses)
  const missesLabel = typeof missesInitial === 'number' ? missesInitial : 0

  const livesInitial = this.registry.get(RegistryKey.Lives)
  const livesLabel = typeof livesInitial === 'number' ? livesInitial : 0

  const laneInitial = this.registry.get(RegistryKey.TargetLane)
  const laneLabel = typeof laneInitial === 'string' ? laneInitial : '—'

  // ── HUD background panel ─────────────────────────────
  const hudPanel = this.add.graphics()
  hudPanel.fillStyle(0x000000, 0.55)
  hudPanel.fillRoundedRect(8, 8, 180, 110, 10)
  hudPanel.lineStyle(1, 0xffffff, 0.15)
  hudPanel.strokeRoundedRect(8, 8, 180, 110, 10)
  hudPanel.setScrollFactor(0).setDepth(999)

  // ── HUD text ──────────────────────────────────────────
  this.hitsText = this.add
    .text(20, 18, `🎾 Hits: ${hitsLabel}`, {
      fontSize: '20px',
      color: '#2ecc71',
      fontStyle: 'bold',
    })
    .setScrollFactor(0)
    .setDepth(1000)

  this.missesText = this.add
    .text(20, 44, `✕ Misses: ${missesLabel}`, {
      fontSize: '16px',
      color: '#e74c3c',
    })
    .setScrollFactor(0)
    .setDepth(1000)

  this.livesText = this.add
    .text(20, 66, `♥ Lives: ${livesLabel}`, {
      fontSize: '16px',
      color: '#f1c40f',
    })
    .setScrollFactor(0)
    .setDepth(1000)

  this.laneText = this.add
    .text(20, 88, `➤ Dir: ${laneLabel}`, {
      fontSize: '16px',
      color: '#aabbcc',
    })
    .setScrollFactor(0)
    .setDepth(1000)

  this.registry.events.on('changedata', this.onRegistryChanged, this)

  this.sys.events.once('shutdown', () => {
    this.registry.events.off('changedata', this.onRegistryChanged, this)
  })
}
private onRegistryChanged(_parent: object, key: string, value: unknown): void {
  if (key === RegistryKey.TargetLane) {
    if (typeof value !== 'string') return
    this.laneText.setText(`➤ Dir: ${value}`)
    return
  }

  if (typeof value !== 'number') return

  if (key === RegistryKey.Hits) {
    this.hitsText.setText(`🎾 Hits: ${value}`)
    return
  }

  if (key === RegistryKey.Misses) {
    this.missesText.setText(`✕ Misses: ${value}`)
    return
  }

  if (key === RegistryKey.Lives) {
    // Color shifts red as lives decrease
    const color = value >= 2 ? '#f1c40f' : value === 1 ? '#e67e22' : '#e74c3c'
    this.livesText.setColor(color)
    this.livesText.setText(`♥ Lives: ${value}`)
  }
 }
}