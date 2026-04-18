import Phaser from 'phaser'
import {
  BALL_SHADOW_ALPHA,
  BALL_SHADOW_SCALE_X,
  BALL_SHADOW_SCALE_Y,
  BALL_SHADOW_Y_OFFSET,
  DEPTH_BALL_BEHIND_NET,
  DEPTH_BALL_IN_FRONT_OF_NET,
  LANE_OFFSET,
  NET_T,
} from '../constants.ts'
import { clamp01, tableX, tableY, type TableDims } from './tablePerspective'

export type DepthBallTuning = {
  tableDims: TableDims
  minRadius: number
  maxRadius: number
  color: number
  /** 1 = linear; higher exaggerates motion/size near the player. */
  easePower: number
  /** Fraction of local half-width for left/right lanes (see {@link LANE_OFFSET}). */
  laneOffset: number
  /** Depth where the net sits; used only for draw order vs the net graphic. */
  netT: number
}

export type DepthBall = {
  circle: Phaser.GameObjects.Arc
  shadow: Phaser.GameObjects.Ellipse
  /** Current depth, where 0 is far and 1 is near. */
  z: number
  /** -1 = left lane, +1 = right lane (clamped in {@link updateVisual}). */
  laneX: number
  /** Apply z/laneX to position, size, shadow, and depth vs the net. */
  updateVisual: () => void
  destroy: () => void
}

/**
 * “Fake 3D” ball: depth `z` maps to the same table perspective as the court.
 */
export function createDepthBall(scene: Phaser.Scene, tuning: DepthBallTuning): DepthBall {
  const laneOffset = tuning.laneOffset ?? LANE_OFFSET
  const netT = tuning.netT ?? NET_T
  const easePower = tuning.easePower ?? 1

  const shadow = scene.add
    .ellipse(0, 0, tuning.minRadius * 2 * BALL_SHADOW_SCALE_X, tuning.minRadius * 2 * BALL_SHADOW_SCALE_Y, 0x000000, BALL_SHADOW_ALPHA)
    .setDepth(DEPTH_BALL_IN_FRONT_OF_NET - 1)

  const circle = scene.add
    .circle(tuning.tableDims.centerX, tuning.tableDims.topY, tuning.minRadius, tuning.color)
    .setDepth(DEPTH_BALL_BEHIND_NET)

  const ball: DepthBall = {
    circle,
    shadow,
    z: 0,
    laneX: 0,
    updateVisual: () => {
      const zClamped = clamp01(ball.z)
      const tVis = Math.pow(zClamped, easePower)
      const dims = tuning.tableDims

      const y = tableY(dims, tVis)
      const laneSign = Phaser.Math.Clamp(ball.laneX, -1, 1)
      const x = tableX(dims, tVis, laneSign, laneOffset)
      const radius = Phaser.Math.Linear(tuning.minRadius, tuning.maxRadius, zClamped)

      ball.circle.setPosition(x, y)
      ball.circle.setRadius(radius)

      const shadowScale = Phaser.Math.Linear(0.55, 1, zClamped)
      ball.shadow.setPosition(x, y + BALL_SHADOW_Y_OFFSET + radius * 0.15)
      ball.shadow.setSize(radius * 2 * BALL_SHADOW_SCALE_X * shadowScale, radius * 2 * BALL_SHADOW_SCALE_Y * shadowScale)

      const inFrontOfNet = zClamped >= netT
      const ballDepth = inFrontOfNet ? DEPTH_BALL_IN_FRONT_OF_NET : DEPTH_BALL_BEHIND_NET
      ball.circle.setDepth(ballDepth)
      ball.shadow.setDepth(ballDepth - 1)
    },
    destroy: () => {
      circle.destroy()
      shadow.destroy()
    },
  }

  ball.updateVisual()
  return ball
}
