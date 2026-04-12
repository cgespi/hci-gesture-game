import Phaser from 'phaser'
import { GAME_HEIGHT, RegistryKey, SceneKey } from '../constants.ts'
import { createBall, resetBall, type Ball } from '../gameplay/Ball.ts'
import { createPaddle, updatePaddleMovement, type Paddle } from '../gameplay/Paddle.ts'
import { createBoundaryWalls } from '../gameplay/Walls.ts'

/** Prevents the paddle collider from awarding several points in one bounce. */
const PADDLE_HIT_COOLDOWN_MS = 140

/**
 * Playfield: placeholder paddle and ball with simple Arcade physics.
 * {@link UIScene} is launched in parallel for the score readout.
 */
export class GameScene extends Phaser.Scene {
  private paddle!: Paddle
  private ball!: Ball
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyA!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  private lastPaddleHitTime = 0

  constructor() {
    super({ key: SceneKey.Game })
  }

  create() {
    // Shared state for HUD (UIScene listens to registry changes).
    this.registry.set(RegistryKey.Score, 0)

    const { group: walls } = createBoundaryWalls(this)
    this.paddle = createPaddle(this)
    this.ball = createBall(this)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)

    // Ball bounces off the three boundary walls.
    this.physics.add.collider(this.ball.circle, walls)

    // Paddle returns the ball and increments score.
    this.physics.add.collider(this.ball.circle, this.paddle.rect, () => this.onPaddleHit(), undefined, this)

    // Overlay UI after gameplay objects exist so the registry already holds a score.
    this.scene.launch(SceneKey.UI)
    this.scene.bringToTop(SceneKey.UI)
  }

  /**
   * When the ball hits the paddle, add a point and add a tiny horizontal kick so motion stays interesting.
   */
  private onPaddleHit(): void {
    const now = this.time.now
    if (now - this.lastPaddleHitTime < PADDLE_HIT_COOLDOWN_MS) return
    this.lastPaddleHitTime = now

    const next = ((this.registry.get(RegistryKey.Score) as number | undefined) ?? 0) + 1
    this.registry.set(RegistryKey.Score, next)

    const body = this.ball.body
    const paddleX = this.paddle.rect.x
    const ballX = this.ball.circle.x
    const delta = (ballX - paddleX) / (this.paddle.rect.width / 2)
    body.setVelocityX(body.velocity.x + delta * 60)
  }

  update(): void {
    updatePaddleMovement(this.paddle, this.cursors, this.keyA, this.keyD)

    // No bottom wall: if the ball leaves the screen, reset it (miss).
    if (this.ball.circle.y > GAME_HEIGHT + 40) {
      resetBall(this.ball)
    }
  }
}
