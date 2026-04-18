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
import { clamp01, projectCourtPoint, widthScaleAtNear, type TableDims } from './tablePerspective'

export type DepthBallTuning = {
  tableDims: TableDims
  minRadius: number
  maxRadius: number
  color: number
  /** Unused for position; ball tracks {@link projectCourtPoint} so it stays glued to the court grid. */
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
 * “Fake 3D” ball: depth `z` maps through the same court projection as the renderer.
 */
export function createDepthBall(scene: Phaser.Scene, tuning: DepthBallTuning): DepthBall {
  const laneOffset = tuning.laneOffset ?? LANE_OFFSET
  const netT = tuning.netT ?? NET_T
  const dims0 = tuning.tableDims
  const p0 = projectCourtPoint(dims0, 0, 0)

  const shadow = scene.add
    .ellipse(0, 0, tuning.minRadius * 2 * BALL_SHADOW_SCALE_X, tuning.minRadius * 2 * BALL_SHADOW_SCALE_Y, 0x000000, BALL_SHADOW_ALPHA)
    .setDepth(DEPTH_BALL_IN_FRONT_OF_NET - 1)

  const circle = scene.add.circle(p0.x, p0.y, tuning.minRadius, tuning.color).setDepth(DEPTH_BALL_BEHIND_NET)

  const wsNear = widthScaleAtNear(dims0)

  const ball: DepthBall = {
    circle,
    shadow,
    z: 0,
    laneX: 0,
    updateVisual: () => {
      const zClamped = clamp01(ball.z)
      const dims = tuning.tableDims
      const laneSign = Phaser.Math.Clamp(ball.laneX, -1, 1)
      const xNorm = laneSign * laneOffset
      const proj = projectCourtPoint(dims, xNorm, zClamped)

      const baseRadius = Phaser.Math.Linear(tuning.minRadius, tuning.maxRadius, zClamped)
      const radius = baseRadius * (proj.widthScale / wsNear)
      const r = Math.max(tuning.minRadius * 0.45, radius)

      ball.circle.setPosition(proj.x, proj.y)
      ball.circle.setRadius(r)

      const shadowScale = Phaser.Math.Linear(0.55, 1, zClamped)
      const shadowYOffset = BALL_SHADOW_Y_OFFSET + r * 0.15
      ball.shadow.setPosition(proj.x, proj.y + shadowYOffset)
      ball.shadow.setSize(r * 2 * BALL_SHADOW_SCALE_X * shadowScale, r * 2 * BALL_SHADOW_SCALE_Y * shadowScale)

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
