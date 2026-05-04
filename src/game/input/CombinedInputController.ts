import type { HitInputEvent, InputController } from './InputController'

/**
 * We combine multiple input sources and expose one hit action per frame.
 * We read keyboard first so fallback/debug controls stay deterministic.
 */
export class CombinedInputController implements InputController {
  private readonly keyboardInput: InputController
  private readonly webcamInput: InputController

  constructor(keyboardInput: InputController, webcamInput: InputController) {
    this.keyboardInput = keyboardInput
    this.webcamInput = webcamInput
  }

  update(dtSeconds: number): void {
    // We update both controllers every frame so readiness/state remains synchronized.
    this.keyboardInput.update(dtSeconds)
    this.webcamInput.update(dtSeconds)
  }

  isReady(): boolean {
    return this.keyboardInput.isReady() && this.webcamInput.isReady()
  }

  consumeHitAction(): HitInputEvent | null {
    // We prioritize keyboard events, then fallback to webcam for the same frame.
    const keyboardAction = this.keyboardInput.consumeHitAction()
    if (keyboardAction) return keyboardAction
    return this.webcamInput.consumeHitAction()
  }

  destroy(): void {
    this.keyboardInput.destroy?.()
    this.webcamInput.destroy?.()
  }
}
