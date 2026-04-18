import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants.ts'

export type CourtView = {
  graphics: Phaser.GameObjects.Graphics
  destroy: () => void
}

export type CourtOptions = {
  horizonY?: number
  nearY?: number
  /**
   * Half-width of the court at the horizon (in pixels).
   * Smaller = more “zoomed out” look.
   */
  farHalfWidth?: number
  /** Half-width of the court near the player (in pixels). */
  nearHalfWidth?: number
}

/**
 * Draws a flat first-person court using simple perspective lines.
 * Placeholder visuals only: no external assets.
 */
export function createCourtRenderer(scene: Phaser.Scene, options: CourtOptions = {}): CourtView {
  const horizonY = options.horizonY ?? 120
  const nearY = options.nearY ?? GAME_HEIGHT - 60
  const farHalfWidth = options.farHalfWidth ?? 95
  const nearHalfWidth = options.nearHalfWidth ?? 320

  const centerX = GAME_WIDTH / 2
  const farLeftX = centerX - farHalfWidth
  const farRightX = centerX + farHalfWidth
  const nearLeftX = centerX - nearHalfWidth
  const nearRightX = centerX + nearHalfWidth

  const g = scene.add.graphics().setDepth(0)

  // Court surface (subtle fill so lines read better).
  g.fillStyle(0x0f1a2b, 1)
  g.fillRect(0, horizonY, GAME_WIDTH, GAME_HEIGHT - horizonY)

  // Boundary lines.
  g.lineStyle(3, 0xffffff, 0.75)
  g.beginPath()
  g.moveTo(farLeftX, horizonY)
  g.lineTo(nearLeftX, nearY)
  g.moveTo(farRightX, horizonY)
  g.lineTo(nearRightX, nearY)
  g.moveTo(farLeftX, horizonY)
  g.lineTo(farRightX, horizonY)
  g.moveTo(nearLeftX, nearY)
  g.lineTo(nearRightX, nearY)
  g.strokePath()

  // Center line (helps sell depth).
  g.lineStyle(2, 0xffffff, 0.35)
  g.beginPath()
  g.moveTo(centerX, horizonY)
  g.lineTo(centerX, nearY)
  g.strokePath()

  // A few “depth markers” across the court.
  g.lineStyle(2, 0xffffff, 0.15)
  const steps = 6
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const y = Phaser.Math.Linear(horizonY, nearY, t)
    const halfW = Phaser.Math.Linear(farHalfWidth, nearHalfWidth, t)
    g.beginPath()
    g.moveTo(centerX - halfW, y)
    g.lineTo(centerX + halfW, y)
    g.strokePath()
  }

  return {
    graphics: g,
    destroy: () => g.destroy(),
  }
}

