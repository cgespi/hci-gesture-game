export type HitAction = 'left' | 'center' | 'right'
export type HitSource = 'keyboard' | 'webcam'
export type HitInputEvent = {
  action: HitAction
  source: HitSource
  timestampMs: number
}

/**
 * Input abstraction layer.
 *
 * Gameplay code should depend on this interface (not on keyboard/webcam APIs).
 * Later we can implement a GestureInputController (MediaPipe) without touching
 * the gameplay state machine.
 */
export interface InputController {
  /**
   * Allow the controller to update internal state each frame (edge detection, smoothing, etc.).
   */
  update(dtSeconds: number): void

  /**
   * Returns a hit action triggered during the *current frame* (since the last `update()` call).
   *
   * Important: this should NOT “queue up” inputs across time, because gameplay needs to
   * distinguish “pressed at the right moment” vs “pressed early”.
   */
  consumeHitAction(): HitInputEvent | null

  /**
   * Optional cleanup hook for controllers that own external resources
   * (camera streams, model instances, DOM overlays, etc.).
   */
  destroy?(): void
}

