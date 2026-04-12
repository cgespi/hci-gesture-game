import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants.ts'

const BALL_RADIUS = 10
const BALL_COLOR = 0xffe66d
const BASE_SPEED = 260

export type Ball = {
  circle: Phaser.GameObjects.Arc
  body: Phaser.Physics.Arcade.Body
}

function randomLaunchVelocity(): { vx: number; vy: number } {
  const signX = Math.random() < 0.5 ? -1 : 1
  const vx = signX * (BASE_SPEED * (0.85 + Math.random() * 0.25))
  const vy = BASE_SPEED * (0.65 + Math.random() * 0.2)
  return { vx, vy: -vy }
}

/**
 * Small circle with a dynamic Arcade body. Starts moving diagonally upward.
 */
export function createBall(scene: Phaser.Scene): Ball {
  const circle = scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, BALL_RADIUS, BALL_COLOR)
  scene.physics.add.existing(circle)

  const body = circle.body as Phaser.Physics.Arcade.Body
  body.setAllowGravity(false)
  body.setBounce(1, 1)
  body.setCollideWorldBounds(false)

  const { vx, vy } = randomLaunchVelocity()
  body.setVelocity(vx, vy)

  return { circle, body }
}

/**
 * Recenters the ball and picks a fresh random direction (used after it leaves the bottom).
 */
export function resetBall(ball: Ball): void {
  ball.circle.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
  ball.body.stop()

  const { vx, vy } = randomLaunchVelocity()
  ball.body.setVelocity(vx, vy)
}
