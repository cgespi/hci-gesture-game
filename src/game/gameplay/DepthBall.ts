import Phaser from 'phaser'
import { GAME_WIDTH } from '../constants.ts'

export type DepthBallTuning = {
  horizonY: number
  nearY: number
  minRadius: number
  maxRadius: number
  color: number
  /** Visual easing for depth mapping (higher = more dramatic growth near the player). */
  easePower: number
}

export type DepthBall = {
  circle: Phaser.GameObjects.Arc
  /** Current depth, where 0 is far and 1 is near. */
  z: number
  /** Normalized lateral lane, where -1 is left, 0 center, +1 right. */
  laneX: number
  /** Apply z/laneX to position and size. */
  updateVisual: () => void
  destroy: () => void
}

const DEFAULT_TUNING: DepthBallTuning = {
  horizonY: 120,
  nearY: 540,
  minRadius: 6,
  maxRadius: 34,
  color: 0xffe66d,
  easePower: 2.2,
}

/**
 * “Fake 3D” ball: one parameter z drives size and screen position.
 * The goal is readability + easy later replacement with real depth or gestures.
 */
export function createDepthBall(scene: Phaser.Scene, tuning: Partial<DepthBallTuning> = {}): DepthBall {
  const t: DepthBallTuning = { ...DEFAULT_TUNING, ...tuning }

  const circle = scene.add.circle(GAME_WIDTH / 2, t.horizonY, t.minRadius, t.color).setDepth(10)

  const ball: DepthBall = {
    circle,
    z: 0,
    laneX: 0,
    updateVisual: () => {
      const zClamped = Phaser.Math.Clamp(ball.z, 0, 1)
      const eased = Math.pow(zClamped, t.easePower)

      // Y moves from horizon toward player.
      const y = Phaser.Math.Linear(t.horizonY, t.nearY, eased)

      // X spreads more near the player than far away.
      const centerX = GAME_WIDTH / 2
      const farSpread = 60
      const nearSpread = 260
      const spread = Phaser.Math.Linear(farSpread, nearSpread, eased)
      const x = centerX + Phaser.Math.Clamp(ball.laneX, -1, 1) * spread

      const radius = Phaser.Math.Linear(t.minRadius, t.maxRadius, eased)

      ball.circle.setPosition(x, y)
      ball.circle.setRadius(radius)
    },
    destroy: () => circle.destroy(),
  }

  ball.updateVisual()
  return ball
}

