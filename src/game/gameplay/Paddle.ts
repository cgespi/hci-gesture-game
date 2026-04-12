import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants.ts'

const PADDLE_WIDTH = 110
const PADDLE_HEIGHT = 18
const PADDLE_COLOR = 0x4ecdc4
const PADDLE_Y = GAME_HEIGHT - 48
const PADDLE_SPEED = 380

export type Paddle = {
  /** Drawn rectangle; also holds the Arcade physics body. */
  rect: Phaser.GameObjects.Rectangle
  body: Phaser.Physics.Arcade.Body
}

/**
 * Placeholder paddle: a horizontal bar near the bottom, moved only on the X axis.
 */
export function createPaddle(scene: Phaser.Scene): Paddle {
  const rect = scene.add.rectangle(GAME_WIDTH / 2, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_COLOR)
  scene.physics.add.existing(rect)

  const body = rect.body as Phaser.Physics.Arcade.Body
  body.setCollideWorldBounds(true)
  body.setImmovable(true)
  body.setAllowGravity(false)

  return { rect, body }
}

/**
 * Reads keyboard arrows / A D and applies horizontal velocity. Y velocity stays 0.
 */
export function updatePaddleMovement(
  paddle: Paddle,
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  keyA: Phaser.Input.Keyboard.Key,
  keyD: Phaser.Input.Keyboard.Key,
): void {
  let vx = 0
  if (cursors.left.isDown || keyA.isDown) vx -= 1
  if (cursors.right.isDown || keyD.isDown) vx += 1

  paddle.body.setVelocityX(vx * PADDLE_SPEED)
}
