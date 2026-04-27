import type { HitInputEvent, InputController } from './InputController'

/**
 * Combines multiple input sources and exposes one hit action per frame.
 * Keyboard is read first so debug/fallback controls stay deterministic.
 */
export class CombinedInputController implements InputController {
  private readonly keyboardInput: InputController
  private readonly webcamInput: InputController

  constructor(keyboardInput: InputController, webcamInput: InputController) {
    this.keyboardInput = keyboardInput
    this.webcamInput = webcamInput
  }

  update(dtSeconds: number): void {
    this.keyboardInput.update(dtSeconds)
    this.webcamInput.update(dtSeconds)
  }

  consumeHitAction(): HitInputEvent | null {
    const keyboardAction = this.keyboardInput.consumeHitAction()
    if (keyboardAction) return keyboardAction
    return this.webcamInput.consumeHitAction()
  }

  destroy(): void {
    this.keyboardInput.destroy?.()
    this.webcamInput.destroy?.()
  }
}
