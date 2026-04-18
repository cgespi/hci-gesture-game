import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, RegistryKey, SceneKey } from '../constants.ts'
import { createCourtRenderer } from '../gameplay/CourtRenderer'
import { createDepthBall, type DepthBall } from '../gameplay/DepthBall'
import { GameState, type GameState as GameStateType } from '../gameplay/GameState'
import type { InputController } from '../input/InputController'
import { KeyboardInputController } from '../input/KeyboardInputController'

const INTERMISSION_SECONDS = 0.6
const MISSED_SECONDS = 0.85

const INCOMING_SPEED_Z_PER_SEC = 0.55
const RETURN_SPEED_Z_PER_SEC = 0.8

// The player can respond only while the ball is in this screen-space band (near the bottom).
// This is intentionally based on rendered Y so it matches what the player sees.
const HIT_WINDOW_START_Y = GAME_HEIGHT - 150
const HIT_WINDOW_END_Y = GAME_HEIGHT - 85

const MAX_MISSES = 3

/**
 * First-person “return the ball” prototype.
 *
 * No real 3D: we fake depth with a single z value (0 far → 1 near) mapped to
 * screen position and ball size.
 * {@link UIScene} is launched in parallel for the score readout.
 */
export class GameScene extends Phaser.Scene {
  private inputController!: InputController

  private state: GameStateType = GameState.Intermission
  private stateTimeSeconds = 0

  private ball!: DepthBall
  private wantsServe = true

  // Simple on-screen prompts (kept inside the gameplay scene).
  private hintText!: Phaser.GameObjects.Text
  private roundOverText!: Phaser.GameObjects.Text
  private keySpace!: Phaser.Input.Keyboard.Key
  private hitWindowDebug!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: SceneKey.Game })
  }

  create() {
    // Shared state for HUD (UIScene listens to registry changes).
    this.registry.set(RegistryKey.Score, 0)
    this.registry.set(RegistryKey.Misses, 0)

    this.inputController = new KeyboardInputController(this)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Placeholder court + ball visuals.
    createCourtRenderer(this, {
      horizonY: 120,
      nearY: GAME_HEIGHT - 60,
      farHalfWidth: 95,
      nearHalfWidth: 320,
    })

    this.ball = createDepthBall(this, {
      horizonY: 120,
      nearY: GAME_HEIGHT - 60,
      minRadius: 6,
      maxRadius: 34,
    })

    // Debug overlay: shows the valid hit window band in screen-space.
    this.hitWindowDebug = this.add.graphics().setDepth(900)
    this.hitWindowDebug.lineStyle(3, 0x00ff66, 1)
    this.hitWindowDebug.strokeRect(
      12,
      HIT_WINDOW_START_Y,
      GAME_WIDTH - 24,
      HIT_WINDOW_END_Y - HIT_WINDOW_START_Y,
    )

    this.hintText = this.add
      .text(GAME_WIDTH / 2, 32, 'Hit when the ball is close: A = left, D = right', {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1000)

    this.roundOverText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontSize: '34px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1100)
      .setVisible(false)

    // Overlay UI after gameplay objects exist so the registry already holds a score.
    this.scene.launch(SceneKey.UI)
    this.scene.bringToTop(SceneKey.UI)

    // Start in intermission; we’ll serve immediately.
    this.enterState(GameState.Intermission)
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 1 / 20)
    this.stateTimeSeconds += dt

    this.inputController.update(dt)

    const isBallInHitWindow = (): boolean => {
      const y = this.ball.circle.y
      return y >= HIT_WINDOW_START_Y && y <= HIT_WINDOW_END_Y
    }

    switch (this.state) {
      case GameState.Intermission: {
        if (this.wantsServe) {
          this.serveIncomingBall()
          this.wantsServe = false
        }

        if (this.stateTimeSeconds >= INTERMISSION_SECONDS) {
          this.enterState(GameState.BallIncoming)
        }
        break
      }

      case GameState.BallIncoming: {
        this.ball.z += INCOMING_SPEED_Z_PER_SEC * dt
        this.ball.updateVisual()

        // Early swing penalty: pressing A/D before the hit window counts as a miss.
        const earlyDir = this.inputController.consumeHitDirection()
        if (earlyDir && this.ball.circle.y < HIT_WINDOW_START_Y) {
          this.onMissedBall()
          break
        }

        if (this.ball.circle.y >= HIT_WINDOW_START_Y) {
          this.enterState(GameState.HitWindow)
        }
        break
      }

      case GameState.HitWindow: {
        // Keep moving forward while the window is open.
        this.ball.z += INCOMING_SPEED_Z_PER_SEC * dt
        this.ball.updateVisual()

        const dir = this.inputController.consumeHitDirection()
        if (dir) {
          if (isBallInHitWindow()) {
            this.onSuccessfulHit(dir)
            break
          }
          // Late swing penalty: input after the window counts as a miss.
          this.onMissedBall()
          break
        }

        if (this.ball.circle.y > HIT_WINDOW_END_Y) {
          this.onMissedBall()
        }
        break
      }

      case GameState.BallReturned: {
        this.ball.z -= RETURN_SPEED_Z_PER_SEC * dt
        this.ball.updateVisual()

        if (this.ball.z <= 0) {
          this.wantsServe = true
          this.enterState(GameState.Intermission)
        }
        break
      }

      case GameState.MissedBall: {
        if (this.stateTimeSeconds >= MISSED_SECONDS) {
          const misses = (this.registry.get(RegistryKey.Misses) as number | undefined) ?? 0
          if (misses >= MAX_MISSES) {
            this.enterState(GameState.RoundOver)
          } else {
            this.wantsServe = true
            this.enterState(GameState.Intermission)
          }
        }
        break
      }

      case GameState.RoundOver: {
        // Let MenuScene handle “start” behavior; here we just wait for input.
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
          this.scene.stop(SceneKey.UI)
          this.scene.start(SceneKey.Menu)
        }
        break
      }
    }
  }

  private enterState(next: GameStateType): void {
    this.state = next
    this.stateTimeSeconds = 0

    if (next === GameState.RoundOver) {
      const score = (this.registry.get(RegistryKey.Score) as number | undefined) ?? 0
      this.roundOverText.setText(`Round over\nScore: ${score}\n\nPress SPACE to return to menu`)
      this.roundOverText.setVisible(true)
      this.hintText.setVisible(false)
    } else {
      this.roundOverText.setVisible(false)
      this.hintText.setVisible(true)
    }
  }

  private serveIncomingBall(): void {
    // Start far away and small.
    this.ball.z = 0

    // Pick a slight initial lane toward center so hits feel readable.
    const laneChoices = [-0.35, 0, 0.35]
    this.ball.laneX = laneChoices[Math.floor(Math.random() * laneChoices.length)] ?? 0
    this.ball.updateVisual()
  }

  private onSuccessfulHit(direction: 'left' | 'right'): void {
    const score = (this.registry.get(RegistryKey.Score) as number | undefined) ?? 0
    this.registry.set(RegistryKey.Score, score + 1)

    // On hit, “send it back” and commit to a left/right return lane.
    // Clamp near the player so the return always starts from a “close” visual.
    this.ball.z = Phaser.Math.Clamp(this.ball.z, 0, 1)
    this.ball.laneX = direction === 'left' ? -1 : 1

    this.enterState(GameState.BallReturned)
  }

  private onMissedBall(): void {
    const misses = (this.registry.get(RegistryKey.Misses) as number | undefined) ?? 0
    this.registry.set(RegistryKey.Misses, misses + 1)

    // Freeze the ball near the player for a moment so the miss feels registered.
    this.ball.z = 1
    this.ball.updateVisual()

    this.enterState(GameState.MissedBall)
  }
}
