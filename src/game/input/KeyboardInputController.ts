import Phaser from 'phaser'
import type { HitAction, HitInputEvent, InputController } from './InputController'

/**
 * Our keyboard implementation of InputController:
 * - A => hit left
 * - D => hit right
 *
 * We use "just pressed" edges so holding a key does not spam hits.
 */
export class KeyboardInputController implements InputController {
  private readonly keyA: Phaser.Input.Keyboard.Key
  private readonly keyD: Phaser.Input.Keyboard.Key

  private hitThisFrame: HitAction | null = null

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard
    if (!keyboard) {
      throw new Error('KeyboardInputController requires a keyboard input plugin.')
    }

    // We keep bindings explicit so controls are easy to explain in demos.
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
  }

  update(_dtSeconds: number): void {
    this.hitThisFrame = null

    // Prioritize the newest press this frame.
    if (Phaser.Input.Keyboard.JustDown(this.keyA)) this.hitThisFrame = 'left'
    if (Phaser.Input.Keyboard.JustDown(this.keyD)) this.hitThisFrame = 'right'
  }

  isReady(): boolean {
    return true
  }

  consumeHitAction(): HitInputEvent | null {
    // We stamp events at consume time so gameplay can compare keyboard/webcam timings consistently.
    if (!this.hitThisFrame) return null
    return {
      action: this.hitThisFrame,
      source: 'keyboard',
      timestampMs: performance.now(),
    }
  }
}

