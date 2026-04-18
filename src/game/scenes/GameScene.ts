import Phaser from 'phaser'
import {
  BALL_COLOR,
  BALL_EASE_POWER,
  BALL_MAX_RADIUS,
  BALL_MIN_RADIUS,
  HIT_ZONE_T0,
  HIT_ZONE_T1,
  INCOMING_SPEED_Z_PER_SEC,
  INTERMISSION_SECONDS,
  LANE_OFFSET,
  MAX_MISSES,
  MISSED_SECONDS,
  NET_T,
  RegistryKey,
  RETURN_SPEED_Z_PER_SEC,
  SceneKey,
  DEPTH_HIT_BAND,
  GAME_HEIGHT,
  GAME_WIDTH,
} from '../constants.ts'
import { createCourtRenderer, redrawHitBand } from '../gameplay/CourtRenderer'
import { createDepthBall, type DepthBall } from '../gameplay/DepthBall'
import { GameState, type GameState as GameStateType } from '../gameplay/GameState'
import { defaultTableDims } from '../gameplay/tablePerspective'
import type { InputController } from '../input/InputController'
import { KeyboardInputController } from '../input/KeyboardInputController'

/**
 * First-person “return the ball” prototype.
 *
 * No real 3D: we fake depth with a single z value (0 far → 1 near) mapped to
 * screen position and ball size using the same trapezoid table as the court.
 * {@link UIScene} is launched in parallel for the score readout.
 */
export class GameScene extends Phaser.Scene {
  private inputController!: InputController

  private state: GameStateType = GameState.Intermission
  private stateTimeSeconds = 0

  private ball!: DepthBall
  private wantsServe = true
  /** -1 = incoming left lane (press A), +1 = right lane (press D). */
  private incomingLane: -1 | 1 = 1

  private readonly tableDims = defaultTableDims()

  private hintText!: Phaser.GameObjects.Text
  private laneHintText!: Phaser.GameObjects.Text
  private roundOverText!: Phaser.GameObjects.Text
  private keySpace!: Phaser.Input.Keyboard.Key
  private hitWindowBand!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: SceneKey.Game })
  }

  create() {
    this.registry.set(RegistryKey.Score, 0)
    this.registry.set(RegistryKey.Misses, 0)

    this.inputController = new KeyboardInputController(this)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    createCourtRenderer(this, this.tableDims)

    this.ball = createDepthBall(this, {
      tableDims: this.tableDims,
      minRadius: BALL_MIN_RADIUS,
      maxRadius: BALL_MAX_RADIUS,
      color: BALL_COLOR,
      easePower: BALL_EASE_POWER,
      laneOffset: LANE_OFFSET,
      netT: NET_T,
    })

    this.hitWindowBand = this.add.graphics().setDepth(DEPTH_HIT_BAND)
    redrawHitBand(this.hitWindowBand, this.tableDims, HIT_ZONE_T0, HIT_ZONE_T1)

    this.hintText = this.add
      .text(GAME_WIDTH / 2, 32, 'When the ball enters the green band: A = left, D = right', {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1000)

    this.laneHintText = this.add
      .text(GAME_WIDTH / 2, 58, '', {
        fontSize: '20px',
        color: '#ffe66d',
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

    this.scene.launch(SceneKey.UI)
    this.scene.bringToTop(SceneKey.UI)

    this.enterState(GameState.Intermission)
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 1 / 20)
    this.stateTimeSeconds += dt

    this.inputController.update(dt)

    const isBallInHitWindow = (): boolean => {
      const z = this.ball.z
      return z >= HIT_ZONE_T0 && z <= HIT_ZONE_T1
    }

    const dirMatchesIncoming = (dir: 'left' | 'right'): boolean => {
      return (dir === 'left' && this.incomingLane === -1) || (dir === 'right' && this.incomingLane === 1)
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

        const earlyDir = this.inputController.consumeHitDirection()
        if (earlyDir && this.ball.z < HIT_ZONE_T0) {
          this.onMissedBall()
          break
        }

        if (this.ball.z >= HIT_ZONE_T0) {
          this.enterState(GameState.HitWindow)
        }
        break
      }

      case GameState.HitWindow: {
        this.ball.z += INCOMING_SPEED_Z_PER_SEC * dt
        this.ball.updateVisual()

        const dir = this.inputController.consumeHitDirection()
        if (dir) {
          if (!isBallInHitWindow()) {
            this.onMissedBall()
            break
          }
          if (!dirMatchesIncoming(dir)) {
            this.onMissedBall()
            break
          }
          this.onSuccessfulHit(dir)
          break
        }

        if (this.ball.z > HIT_ZONE_T1) {
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
      this.laneHintText.setVisible(false)
    } else {
      this.roundOverText.setVisible(false)
      this.hintText.setVisible(true)
      this.laneHintText.setVisible(true)
    }
  }

  private serveIncomingBall(): void {
    this.ball.z = 0
    this.incomingLane = Math.random() < 0.5 ? -1 : 1
    this.ball.laneX = this.incomingLane
    this.ball.updateVisual()

    this.laneHintText.setText(this.incomingLane === -1 ? 'Incoming: LEFT' : 'Incoming: RIGHT')
  }

  private onSuccessfulHit(direction: 'left' | 'right'): void {
    const score = (this.registry.get(RegistryKey.Score) as number | undefined) ?? 0
    this.registry.set(RegistryKey.Score, score + 1)

    this.ball.z = Phaser.Math.Clamp(this.ball.z, 0, 1)
    this.ball.laneX = direction === 'left' ? -1 : 1

    this.enterState(GameState.BallReturned)
  }

  private onMissedBall(): void {
    const misses = (this.registry.get(RegistryKey.Misses) as number | undefined) ?? 0
    this.registry.set(RegistryKey.Misses, misses + 1)

    this.ball.z = 1
    this.ball.updateVisual()

    this.enterState(GameState.MissedBall)
  }
}
