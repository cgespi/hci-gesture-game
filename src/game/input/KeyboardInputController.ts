import Phaser from 'phaser'
import type { HitAction, HitInputEvent, InputController } from './InputController'

/**
 * Keyboard implementation of InputController:
 * - A => hit left
 * - D => hit right
 *
 * Uses "just pressed" edges so holding a key doesn't spam hits.
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
    if (!this.hitThisFrame) return null
    return {
      action: this.hitThisFrame,
      source: 'keyboard',
      timestampMs: performance.now(),
    }
  }
}

