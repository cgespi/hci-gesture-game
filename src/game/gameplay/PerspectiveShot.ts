import Phaser from 'phaser'
import { HIT_DEPTH_WINDOW_END, HIT_DEPTH_WINDOW_START } from '../constants.ts'

export type ShotEndpoints = {
  start: Phaser.Math.Vector2
  control: Phaser.Math.Vector2
  end: Phaser.Math.Vector2
}

export type PerspectiveShotParams = {
  durationMs: number
  endpoints: ShotEndpoints
  minScale: number
  maxScale: number
}

export type PerspectiveShotSnapshot = {
  /** 0..1, linear time progress */
  rawProgress: number
  /** 0..1, eased progress used for perspective feel */
  depth: number
  x: number
  y: number
  scale: number
  inHitWindow: boolean
  done: boolean
}

export class PerspectiveShot {
  private elapsedMs = 0
  private readonly durationMs: number
  private readonly start: Phaser.Math.Vector2
  private readonly control: Phaser.Math.Vector2
  private readonly end: Phaser.Math.Vector2
  private readonly minScale: number
  private readonly maxScale: number

  constructor(params: PerspectiveShotParams) {
    this.durationMs = Math.max(1, params.durationMs | 0)
    this.start = params.endpoints.start.clone()
    this.control = params.endpoints.control.clone()
    this.end = params.endpoints.end.clone()
    this.minScale = params.minScale
    this.maxScale = params.maxScale
  }

  update(dtMs: number): PerspectiveShotSnapshot {
    this.elapsedMs += Math.max(0, dtMs)
    return this.getSnapshot()
  }

  getSnapshot(): PerspectiveShotSnapshot {
    const rawProgress = Phaser.Math.Clamp(this.elapsedMs / this.durationMs, 0, 1)

    // Stronger ease-in makes the ball feel like it accelerates toward the player.
    const depth = Phaser.Math.Easing.Cubic.In(rawProgress)

    const x = this.quadraticBezier(this.start.x, this.control.x, this.end.x, depth)
    const y = this.quadraticBezier(this.start.y, this.control.y, this.end.y, depth)
    const scale = Phaser.Math.Linear(this.minScale, this.maxScale, depth)

    const inHitWindow = depth >= HIT_DEPTH_WINDOW_START && depth <= HIT_DEPTH_WINDOW_END
    const done = rawProgress >= 1

    return { rawProgress, depth, x, y, scale, inHitWindow, done }
  }

  private quadraticBezier(p0: number, p1: number, p2: number, t: number): number {
    // B(t) = (1-t)^2*p0 + 2*(1-t)*t*p1 + t^2*p2
    const u = 1 - t
    return u * u * p0 + 2 * u * t * p1 + t * t * p2
  }

  reset(): void {
    this.elapsedMs = 0
  }
}

