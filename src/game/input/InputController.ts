export type HitAction = 'left' | 'center' | 'right'
export type HitSource = 'keyboard' | 'webcam'
export type HitInputEvent = {
  action: HitAction
  source: HitSource
  timestampMs: number
}

/**
 * Our input abstraction layer.
 *
 * We keep gameplay dependent on this interface (not raw keyboard/webcam APIs),
 * so we can swap input sources without rewriting the gameplay state machine.
 */
export interface InputController {
  /**
   * We update controller internals each frame (edge detection, smoothing, etc.).
   */
  update(dtSeconds: number): void

  /**
   * Returns true when this input source is ready for gameplay.
   * For always-available inputs (for example keyboard), this should return true.
   */
  isReady(): boolean

  /**
   * Returns a hit action triggered during the *current frame* (since the last `update()` call).
   *
   * We intentionally avoid long-lived input queues, because our gameplay needs to
   * distinguish "pressed at the right moment" vs "pressed early".
   */
  consumeHitAction(): HitInputEvent | null

  /**
   * Optional cleanup hook for controllers that own external resources
   * (camera streams, model instances, DOM overlays, etc.).
   */
  destroy?(): void
}

