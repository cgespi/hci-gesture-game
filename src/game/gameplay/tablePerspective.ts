/**
 * We fake a first-person “3D” ping-pong court using only 2D drawing/math.
 *
 * Our court space uses normalized coordinates:
 * - `xNorm` in [-1, 1]: full width at that depth (left sideline → right sideline).
 * - `zNorm` in [0, 1]: depth from far (opponent, top) to near (player, below screen).
 *
 * Screen Y grows downward. We map depth with a power curve and add bottom overscan so the
 * near baseline can sit below the canvas. This helps our player viewpoint feel "inside" court space.
 */

import { GAME_HEIGHT, GAME_WIDTH } from '../constants.ts'

/** Layout + projection parameters built from {@link COURT_PERSPECTIVE} and game size. */
export type TableDims = {
  centerX: number
  screenWidth: number
  screenHeight: number
  horizonY: number
  overscanBottom: number
  farHalfWidth: number
  nearHalfWidth: number
  depthExponent: number
  /** Y at zNorm = 0 (far baseline); equals horizonY with the standard formula. */
  topY: number
  /** Y at zNorm = 1 (near baseline); typically below the canvas. */
  bottomY: number
  /** Same as far half-width (legacy name for callers). */
  topHalfWidth: number
  /** Same as near half-width (legacy name). */
  bottomHalfWidth: number
}

export type ProjectedCourtPoint = {
  x: number
  y: number
  /**
   * halfWidth(z) / farHalfWidth — equals 1 at the far end, grows toward the player.
   * Useful to scale sprites (e.g. ball) so they shrink convincingly toward the horizon.
   */
  widthScale: number
}

export function lerp(a: number, b: number, t: number): number {
  // We keep interpolation helpers local so perspective math stays readable.
  return a + (b - a) * t
}

export function clamp01(t: number): number {
  if (t < 0) return 0
  if (t > 1) return 1
  return t
}

/**
 * We map a point on the abstract court plane into screen pixels.
 *
 * We use `te = zNorm ** depthExponent` for both Y and width so horizontal slices stay consistent.
 */
export function projectCourtPoint(dims: TableDims, xNorm: number, zNorm: number): ProjectedCourtPoint {
  const z = clamp01(zNorm)
  const te = Math.pow(z, dims.depthExponent)
  const y = dims.horizonY + te * (dims.screenHeight - dims.horizonY + dims.overscanBottom)
  const halfW = lerp(dims.farHalfWidth, dims.nearHalfWidth, te)
  const x = dims.centerX + xNorm * halfW
  const widthScale = halfW / dims.farHalfWidth
  return { x, y, widthScale }
}

export function tableY(dims: TableDims, t: number): number {
  // We centralize this lookup to avoid duplicating depth-to-screen conversion details.
  return projectCourtPoint(dims, 0, t).y
}

export function tableHalfWidth(dims: TableDims, t: number): number {
  const z = clamp01(t)
  const te = Math.pow(z, dims.depthExponent)
  return lerp(dims.farHalfWidth, dims.nearHalfWidth, te)
}

/**
 * @param laneSign -1 = left lane, +1 = right lane
 * @param laneOffset 0..1 fraction of local half-width (keeps ball inside sidelines)
 */
export function tableX(dims: TableDims, t: number, laneSign: number, laneOffset: number): number {
  // We keep lane placement proportional to local half-width so lanes stay inside sidelines at any depth.
  return projectCourtPoint(dims, laneSign * laneOffset, t).x
}

export type TrapezoidCorners = {
  y: number
  halfW: number
  leftX: number
  rightX: number
}

export function trapezoidRow(dims: TableDims, t: number): TrapezoidCorners {
  const left = projectCourtPoint(dims, -1, t)
  const right = projectCourtPoint(dims, 1, t)
  const halfW = (right.x - left.x) / 2
  return {
    y: left.y,
    halfW,
    leftX: left.x,
    rightX: right.x,
  }
}

/**
 * We return four corners for table fills: far-left, far-right, near-right, near-left.
 * Order is suitable for two triangles or a closed polygon path.
 */
export function tableSurfaceQuad(dims: TableDims): {
  farLeftX: number
  farRightX: number
  nearLeftX: number
  nearRightX: number
  farY: number
  nearY: number
} {
  const fl = projectCourtPoint(dims, -1, 0)
  const fr = projectCourtPoint(dims, 1, 0)
  const nl = projectCourtPoint(dims, -1, 1)
  const nr = projectCourtPoint(dims, 1, 1)
  return {
    farLeftX: fl.x,
    farRightX: fr.x,
    nearLeftX: nl.x,
    nearRightX: nr.x,
    farY: fl.y,
    nearY: nl.y,
  }
}

/** We build a quad band between two depth slices (t0 < t1), useful for our hit-zone overlays. */
export function hitBandQuad(
  dims: TableDims,
  t0: number,
  t1: number,
): { x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number } {
  const a0 = projectCourtPoint(dims, -1, t0)
  const a1 = projectCourtPoint(dims, 1, t0)
  const b1 = projectCourtPoint(dims, 1, t1)
  const b0 = projectCourtPoint(dims, -1, t1)
  return {
    x0: a0.x,
    y0: a0.y,
    x1: a1.x,
    y1: a1.y,
    x2: b1.x,
    y2: b1.y,
    x3: b0.x,
    y3: b0.y,
  }
}

/** We expose near-edge width scale to normalize sprite sizing against perspective. */
export function widthScaleAtNear(dims: TableDims): number {
  return dims.nearHalfWidth / dims.farHalfWidth
}

/** We provide a reusable default court layout tuned for our game viewport. */
export function defaultTableDims(): TableDims {
  // We keep this legacy table profile for reference even though the cannon prototype uses lane endpoints.
  const p = {
    horizonYRatio: 0.18,
    overscanBottom: 220,
    farCourtWidth: GAME_WIDTH * 0.22,
    nearCourtWidth: GAME_WIDTH * 1.05,
    depthExponent: 1.7,
    depthStripeCount: 5,
    serviceLineZ0: 0.32,
    serviceLineZ1: 0.68,
  } as const
  const centerX = GAME_WIDTH / 2
  const horizonY = GAME_HEIGHT * p.horizonYRatio
  const farHalf = p.farCourtWidth / 2
  const nearHalf = p.nearCourtWidth / 2
  const dims: TableDims = {
    centerX,
    screenWidth: GAME_WIDTH,
    screenHeight: GAME_HEIGHT,
    horizonY,
    overscanBottom: p.overscanBottom,
    farHalfWidth: farHalf,
    nearHalfWidth: nearHalf,
    depthExponent: p.depthExponent,
    topY: horizonY,
    bottomY: horizonY + (GAME_HEIGHT - horizonY + p.overscanBottom),
    topHalfWidth: farHalf,
    bottomHalfWidth: nearHalf,
  }
  return dims
}
