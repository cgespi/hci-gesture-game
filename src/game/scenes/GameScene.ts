import Phaser from 'phaser'
import {
  BALL_COLOR,
  BALL_RADIUS,
  BALL_HIT_WINDOW_COLOR,
  BALL_MAX_SCALE,
  BALL_MIN_SCALE,
  CANNON_COLOR,
  CANNON_HEIGHT,
  CANNON_WIDTH,
  DEBUG_SHOW_HIT_ZONE,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_COLOR,
  GROUND_HEIGHT_RATIO,
  HIT_ZONE_COLOR,
  HIT_ZONE_FILL_ALPHA,
  HIT_ZONE_HEIGHT,
  HIT_ZONE_STROKE_ALPHA,
  HIT_ZONE_WIDTH,
  HIT_ZONE_Y,
  LANE_NEAR_POINTS,
  SHOT_ARC_HEIGHT_PX,
  SHOT_ARC_PEAK_T,
  laneX,
  type Lane,
  RegistryKey,
  RESET_DELAY_MS,
  SceneKey,
  SHADOW_COLOR,
  SHADOW_HEIGHT_RADIUS,
  SHADOW_MAX_ALPHA,
  SHADOW_MIN_ALPHA,
  SHADOW_WIDTH_RADIUS,
  SHADOW_Y_OFFSET_MAX,
  SHADOW_Y_OFFSET_MIN,
  SHOT_DURATION_MS,
  SKY_COLOR,
  STARTING_LIVES,
} from '../constants.ts'
import { GameState, type GameState as GameStateType } from '../gameplay/GameState'
import { PerspectiveShot } from '../gameplay/PerspectiveShot'
import type { InputController } from '../input/InputController'
import { KeyboardInputController } from '../input/KeyboardInputController'

/**
 * Lane-based “cannon reaction” prototype.
 *
 * The cannon fires a ball into one of three lanes, and the player must hit with
 * correct timing while the ball overlaps the temporary “REACT NOW!” hit zone.
 */
export class GameScene extends Phaser.Scene {
  private inputController!: InputController

  private state: GameStateType = GameState.PreparingShot
  private stateTimeMs = 0

  private ball!: Phaser.GameObjects.Arc
  private cannon!: Phaser.GameObjects.Rectangle
  private shadow!: Phaser.GameObjects.Ellipse

  private hitZoneRect!: Phaser.GameObjects.Rectangle
  private hitZoneLabel!: Phaser.GameObjects.Text

  private targetLane: Lane = 'center'
  private currentShot: PerspectiveShot | null = null
  private currentShotInHitWindow = false
  private shotResolved = false

  private roundOverText!: Phaser.GameObjects.Text
  private keySpace!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: SceneKey.Game })
  }

  create() {
    this.registry.set(RegistryKey.Hits, 0)
    this.registry.set(RegistryKey.Misses, 0)
    this.registry.set(RegistryKey.Lives, STARTING_LIVES)
    this.registry.set(RegistryKey.TargetLane, '—')

    this.inputController = new KeyboardInputController(this)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.cameras.main.setBackgroundColor(SKY_COLOR)

    const groundHeight = Math.round(GAME_HEIGHT * GROUND_HEIGHT_RATIO)
    const groundTopY = GAME_HEIGHT - groundHeight
    this.add
      .rectangle(0, groundTopY, GAME_WIDTH, groundHeight, GROUND_COLOR)
      .setOrigin(0, 0)

    // Place cannon directly on the sky/field boundary line.
    const cannonY = groundTopY
    this.cannon = this.add
      .rectangle(GAME_WIDTH / 2, cannonY, CANNON_WIDTH, CANNON_HEIGHT, CANNON_COLOR)
      .setOrigin(0.5, 1)

    // Shadow renders behind the ball and grows as it approaches.
    this.shadow = this.add
      .ellipse(this.cannon.x, this.cannon.y, SHADOW_WIDTH_RADIUS * 2, SHADOW_HEIGHT_RADIUS * 2, SHADOW_COLOR, SHADOW_MIN_ALPHA)
      .setOrigin(0.5, 0.5)
      .setDepth(5)

    this.ball = this.add
      .circle(this.cannon.x, this.cannon.y - CANNON_HEIGHT - BALL_RADIUS, BALL_RADIUS, BALL_COLOR)
      .setDepth(10)

    this.hitZoneRect = this.add
      .rectangle(0, HIT_ZONE_Y, HIT_ZONE_WIDTH, HIT_ZONE_HEIGHT, HIT_ZONE_COLOR, HIT_ZONE_FILL_ALPHA)
      .setOrigin(0.5, 0)
      .setStrokeStyle(3, HIT_ZONE_COLOR, HIT_ZONE_STROKE_ALPHA)

    this.hitZoneLabel = this.add
      .text(0, HIT_ZONE_Y + 12, 'REACT NOW!', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5, 0)

    if (!DEBUG_SHOW_HIT_ZONE) {
      this.hitZoneRect.setVisible(false)
      this.hitZoneLabel.setVisible(false)
    }

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

    this.enterState(GameState.PreparingShot)
  }

  update(_time: number, deltaMs: number): void {
    const dtMs = Math.min(deltaMs, 50)
    this.stateTimeMs += dtMs

    this.inputController.update(dtMs / 1000)

    const action = this.inputController.consumeHitAction()
    if (action) this.tryResolveShotFromInput(action)

    switch (this.state) {
      case GameState.PreparingShot: {
        if (this.stateTimeMs >= RESET_DELAY_MS) {
          this.fireShot()
          this.enterState(GameState.BallInFlight)
        }
        break
      }

      case GameState.BallInFlight: {
        if (this.currentShot) {
          const s = this.currentShot.update(dtMs)
          this.applyShotSnapshot(s)

          // If the shot reached the player without input resolution, it’s a late miss.
          if (s.done && !this.shotResolved) {
            this.onMissedShot()
            this.enterState(GameState.ResolvingShot)
          }
        }
        break
      }

      case GameState.ResolvingShot: {
        if (this.stateTimeMs >= RESET_DELAY_MS) {
          const lives = this.getLives()
          if (lives <= 0) {
            this.enterState(GameState.RoundOver)
          } else {
            this.enterState(GameState.PreparingShot)
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
    this.stateTimeMs = 0

    if (next !== GameState.BallInFlight) {
      // Reset transient shot visuals when leaving flight.
      this.currentShotInHitWindow = false
      this.hitZoneRect.setFillStyle(HIT_ZONE_COLOR, HIT_ZONE_FILL_ALPHA)
      this.ball.setFillStyle(BALL_COLOR)
    }

    if (next === GameState.RoundOver) {
      const hits = this.getHits()
      const misses = this.getMisses()
      this.roundOverText.setText(`Game over\nHits: ${hits}\nMisses: ${misses}\n\nPress SPACE to return to menu`)
      this.roundOverText.setVisible(true)
    } else {
      this.roundOverText.setVisible(false)
    }
  }

  private fireShot(): void {
    this.shotResolved = false
    this.currentShotInHitWindow = false
    this.currentShot = null

    const lanes: Lane[] = ['left', 'center', 'right']
    this.targetLane = Phaser.Utils.Array.GetRandom(lanes)
    this.registry.set(RegistryKey.TargetLane, this.targetLane)

    const x = laneX(this.targetLane)
    this.hitZoneRect.setX(x)
    this.hitZoneLabel.setX(x)

    // Create a pseudo-perspective shot:
    // - Always starts at the cannon mouth (center)
    // - Arcs upward into the sky
    // - Curves down toward the selected lane near point while scaling up
    const start = new Phaser.Math.Vector2(this.cannon.x, this.cannon.y - CANNON_HEIGHT - BALL_RADIUS)
    const end = new Phaser.Math.Vector2(LANE_NEAR_POINTS[this.targetLane].x, LANE_NEAR_POINTS[this.targetLane].y)
    const peakX = Phaser.Math.Linear(start.x, end.x, SHOT_ARC_PEAK_T)
    const peakY = Math.min(start.y, end.y) - SHOT_ARC_HEIGHT_PX
    const control = new Phaser.Math.Vector2(peakX, peakY)

    this.currentShot = new PerspectiveShot({
      durationMs: SHOT_DURATION_MS,
      endpoints: {
        start,
        control,
        end,
      },
      minScale: BALL_MIN_SCALE,
      maxScale: BALL_MAX_SCALE,
    })

    this.applyShotSnapshot(this.currentShot.getSnapshot())
  }

  private tryResolveShotFromInput(action: 'left' | 'center' | 'right'): void {
    if (this.state !== GameState.BallInFlight) return
    if (this.shotResolved) return
    if (!this.currentShot) return

    const timingOk = this.currentShot.getSnapshot().inHitWindow

    const laneMatches =
      this.targetLane === 'center'
        ? action === 'left' || action === 'right' || action === 'center'
        : action === this.targetLane

    if (timingOk && laneMatches) {
      this.onSuccessfulHit()
    } else {
      this.onMissedShot()
    }

    this.enterState(GameState.ResolvingShot)
  }

  private applyShotSnapshot(s: {
    x: number
    y: number
    scale: number
    depth: number
    inHitWindow: boolean
  }): void {
    this.ball.setPosition(s.x, s.y)
    this.ball.setScale(s.scale)

    // Shadow: grows + darkens slightly as the ball approaches.
    const shadowY = s.y + Phaser.Math.Linear(SHADOW_Y_OFFSET_MIN, SHADOW_Y_OFFSET_MAX, s.depth)
    const shadowAlpha = Phaser.Math.Linear(SHADOW_MIN_ALPHA, SHADOW_MAX_ALPHA, s.depth)
    this.shadow.setPosition(s.x, shadowY)
    this.shadow.setScale(s.scale)
    this.shadow.setAlpha(shadowAlpha)

    // Simple hit-window cue.
    if (s.inHitWindow) {
      this.ball.setFillStyle(BALL_HIT_WINDOW_COLOR)
      if (!this.currentShotInHitWindow) {
        this.currentShotInHitWindow = true
        this.hitZoneRect.setFillStyle(HIT_ZONE_COLOR, HIT_ZONE_FILL_ALPHA + 0.12)
      }
    } else {
      this.ball.setFillStyle(BALL_COLOR)
      if (this.currentShotInHitWindow) {
        this.currentShotInHitWindow = false
        this.hitZoneRect.setFillStyle(HIT_ZONE_COLOR, HIT_ZONE_FILL_ALPHA)
      }
    }
  }

  private onSuccessfulHit(): void {
    this.shotResolved = true
    const hits = this.getHits()
    this.registry.set(RegistryKey.Hits, hits + 1)
  }

  private onMissedShot(): void {
    this.shotResolved = true
    const misses = this.getMisses()
    this.registry.set(RegistryKey.Misses, misses + 1)

    const lives = this.getLives()
    this.registry.set(RegistryKey.Lives, Math.max(0, lives - 1))
  }

  private getHits(): number {
    return ((this.registry.get(RegistryKey.Hits) as number | undefined) ?? 0) | 0
  }

  private getMisses(): number {
    return ((this.registry.get(RegistryKey.Misses) as number | undefined) ?? 0) | 0
  }

  private getLives(): number {
    return ((this.registry.get(RegistryKey.Lives) as number | undefined) ?? STARTING_LIVES) | 0
  }
}
