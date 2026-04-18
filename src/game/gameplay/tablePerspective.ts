/**
 * Fake first-person “3D” ping-pong table using a single depth parameter `t`.
 *
 * - `t` is **normalized depth** from 0 (far / opponent) to 1 (near / player), not time.
 * - Screen **Y** increases downward: small Y = far end of the table, large Y = near end.
 * - Table **half-width** grows with `t`, so the table is a trapezoid (wider near the bottom).
 *
 * Mapping (linear in `t` unless you apply easing at the call site):
 * - y = lerp(topY, bottomY, t)
 * - halfWidth = lerp(topHalfWidth, bottomHalfWidth, t)
 * - ball x = centerX + laneSign * halfWidth * LANE_OFFSET
 */

import {
  GAME_WIDTH,
  TABLE_BOTTOM_HALF_WIDTH,
  TABLE_BOTTOM_Y,
  TABLE_TOP_HALF_WIDTH,
  TABLE_TOP_Y,
} from '../constants.ts'

/** Table layout shared by renderer, ball, and hit-band drawing. */
export type TableDims = {
  centerX: number
  topY: number
  bottomY: number
  topHalfWidth: number
  bottomHalfWidth: number
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp01(t: number): number {
  if (t < 0) return 0
  if (t > 1) return 1
  return t
}

export function tableY(dims: TableDims, t: number): number {
  return lerp(dims.topY, dims.bottomY, clamp01(t))
}

export function tableHalfWidth(dims: TableDims, t: number): number {
  return lerp(dims.topHalfWidth, dims.bottomHalfWidth, clamp01(t))
}

/**
 * @param laneSign -1 = left lane, +1 = right lane
 * @param laneOffset 0..1 fraction of local half-width (keeps ball inside sidelines)
 */
export function tableX(dims: TableDims, t: number, laneSign: number, laneOffset: number): number {
  const halfW = tableHalfWidth(dims, t)
  return dims.centerX + laneSign * halfW * laneOffset
}

export type TrapezoidCorners = {
  y: number
  halfW: number
  leftX: number
  rightX: number
}

export function trapezoidRow(dims: TableDims, t: number): TrapezoidCorners {
  const y = tableY(dims, t)
  const halfW = tableHalfWidth(dims, t)
  return {
    y,
    halfW,
    leftX: dims.centerX - halfW,
    rightX: dims.centerX + halfW,
  }
}

/**
 * Four corners of the table trapezoid for fills: far-left, far-right, near-right, near-left.
 * Order is suitable for `Graphics.fillTriangle` (two triangles) or a closed polygon path.
 */
export function tableSurfaceQuad(dims: TableDims): {
  farLeftX: number
  farRightX: number
  nearLeftX: number
  nearRightX: number
  farY: number
  nearY: number
} {
  return {
    farLeftX: dims.centerX - dims.topHalfWidth,
    farRightX: dims.centerX + dims.topHalfWidth,
    nearLeftX: dims.centerX - dims.bottomHalfWidth,
    nearRightX: dims.centerX + dims.bottomHalfWidth,
    farY: dims.topY,
    nearY: dims.bottomY,
  }
}

/** Band between two depth slices (t0 < t1): polygon corners for semi-transparent hit zone. */
export function hitBandQuad(
  dims: TableDims,
  t0: number,
  t1: number,
): { x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number } {
  const a = trapezoidRow(dims, t0)
  const b = trapezoidRow(dims, t1)
  // Far edge at t0 (smaller y), near edge at t1 (larger y): CCW from far-left
  return {
    x0: a.leftX,
    y0: a.y,
    x1: a.rightX,
    y1: a.y,
    x2: b.rightX,
    y2: b.y,
    x3: b.leftX,
    y3: b.y,
  }
}

/** Default table layout from shared game constants (single tweak surface). */
export function defaultTableDims(): TableDims {
  return {
    centerX: GAME_WIDTH / 2,
    topY: TABLE_TOP_Y,
    bottomY: TABLE_BOTTOM_Y,
    topHalfWidth: TABLE_TOP_HALF_WIDTH,
    bottomHalfWidth: TABLE_BOTTOM_HALF_WIDTH,
  }
}
