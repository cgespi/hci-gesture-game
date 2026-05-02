import Phaser from 'phaser'
import {
  BALL_COLOR,
  BALL_RADIUS,
  BALL_HIT_WINDOW_COLOR,
  BALL_MISS_FALL_DURATION_MS,
  BALL_MISS_FALL_END_Y,
  BALL_MISS_FALL_END_SCALE_MULTIPLIER,
  BALL_MAX_SCALE,
  BALL_MIN_SCALE,
  BALL_RETURN_DURATION_MS,
  BALL_RETURN_END_SCALE,
  BALL_RETURN_TARGET_Y,
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
  WEBCAM_EARLY_BUFFER_MS,
  WEBCAM_LATE_GRACE_MS,
} from '../constants.ts'
import { GameState, type GameState as GameStateType } from '../gameplay/GameState'
import { PerspectiveShot } from '../gameplay/PerspectiveShot'
import type { HitAction, HitInputEvent, InputController } from '../input/InputController'
import { CombinedInputController } from '../input/CombinedInputController'
import { KeyboardInputController } from '../input/KeyboardInputController'
import { MediaPipeHandInput } from '../input/MediaPipeHandInput'

/**
 * Lane-based “cannon reaction” prototype.
 *
 * The cannon fires a ball into one of three lanes, and the player must hit with
 * correct timing while the ball overlaps the temporary “REACT NOW!” hit zone.
 */
export class GameScene extends Phaser.Scene {
  private inputController!: InputController

  private state: GameStateType = GameState.Initializing
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
  private outcomeStartX = 0
  private outcomeStartY = 0
  private outcomeStartScale = 1
  private outcomeStartDepth = 0
  private missFallTargetX = 0
  private previousShotX: number | null = null
  private previousShotY: number | null = null
  private shotMotionX = 0
  private shotMotionY = 1
  private bufferedWebcamAction: HitAction | null = null
  private bufferedWebcamAtMs = Number.NEGATIVE_INFINITY
  private lastHitZoneSeenAtMs = Number.NEGATIVE_INFINITY

  private roundOverText!: Phaser.GameObjects.Text
  private initializingBackdrop!: Phaser.GameObjects.Rectangle
  private initializingText!: Phaser.GameObjects.Text
  private keySpace!: Phaser.Input.Keyboard.Key
  private keyEnter!: Phaser.Input.Keyboard.Key
  private keyEsc!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: SceneKey.Game })
  }

  create() {
    this.registry.set(RegistryKey.Hits, 0)
    this.registry.set(RegistryKey.Misses, 0)
    this.registry.set(RegistryKey.Lives, STARTING_LIVES)
    this.registry.set(RegistryKey.TargetLane, '—')

    const keyboardInput = new KeyboardInputController(this)
    const webcamInput = new MediaPipeHandInput()
    this.inputController = new CombinedInputController(keyboardInput, webcamInput)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyEnter = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController.destroy?.()
    })

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
    if (this.registry.get('difficulty') != 'Easy'){
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

    this.initializingBackdrop = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5)
      .setOrigin(0, 0)
      .setDepth(1080)
      .setVisible(false)

    this.initializingText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Initializing...', {
        fontSize: '34px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1100)
      .setVisible(false)

    this.scene.launch(SceneKey.UI)
    this.scene.bringToTop(SceneKey.UI)

    this.enterState(GameState.Initializing)
  }

  update(_time: number, deltaMs: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc) && !this.scene.isActive(SceneKey.Pause) && this.state != GameState.RoundOver) {
      this.scene.pause(SceneKey.UI)
      this.scene.launch(SceneKey.Pause)
      this.scene.bringToTop(SceneKey.Pause)
      this.scene.pause()
      return
    }

    const dtMs = Math.min(deltaMs, 50)
    this.stateTimeMs += dtMs

    this.inputController.update(dtMs / 1000)

    const event = this.inputController.consumeHitAction()
    if (event) this.handleInputEvent(event)

    switch (this.state) {
      case GameState.Initializing: {
        if (this.inputController.isReady()) {
          this.enterState(GameState.PreparingShot)
        }
        break
      }

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
            this.beginOutcomeAnimationFromSnapshot(s)
            this.prepareMissFallTarget()
            this.enterState(GameState.MissFall)
          }
        }
        break
      }

      case GameState.HitReturn: {
        this.updateHitReturn()
        break
      }

      case GameState.MissFall: {
        this.updateMissFall()
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
          this.scene.start(SceneKey.Settings)
        } else if (Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
          this.scene.stop(SceneKey.UI)
          this.scene.restart()
        }
        break
      }
    }

    const nowMs = performance.now()
    this.tryConsumeBufferedWebcamHit(nowMs)
  }

  private enterState(next: GameStateType): void {
    this.state = next
    this.stateTimeMs = 0

    if (next !== GameState.BallInFlight && next !== GameState.HitReturn && next !== GameState.MissFall) {
      // Reset transient shot visuals when leaving flight.
      this.currentShotInHitWindow = false
      this.hitZoneRect.setFillStyle(HIT_ZONE_COLOR, HIT_ZONE_FILL_ALPHA)
      this.ball.setFillStyle(BALL_COLOR)
    }

    if (next === GameState.RoundOver) {
      const hits = this.getHits()
      const misses = this.getMisses()
      this.roundOverText.setText(`Game over\nHits: ${hits}\nMisses: ${misses}\n\nPress Enter to restart\n Press Space to edit settings`)
      this.roundOverText.setVisible(true)
    } else {
      this.roundOverText.setVisible(false)
    }

    const showInitializingOverlay = next === GameState.Initializing
    this.initializingBackdrop.setVisible(showInitializingOverlay)
    this.initializingText.setVisible(showInitializingOverlay)
  }

  private fireShot(): void {
    this.shotResolved = false
    this.currentShotInHitWindow = false
    this.currentShot = null
    this.previousShotX = null
    this.previousShotY = null
    this.shotMotionX = 0
    this.shotMotionY = 1
    this.bufferedWebcamAction = null
    this.bufferedWebcamAtMs = Number.NEGATIVE_INFINITY
    this.lastHitZoneSeenAtMs = Number.NEGATIVE_INFINITY

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

  private attemptHit(action: HitAction, allowLateGraceWindow = false): void {
    this.tryResolveShotFromInput(action, allowLateGraceWindow)
  }

  private handleInputEvent(event: HitInputEvent): void {
    if (event.source === 'keyboard') {
      this.attemptHit(event.action)
      return
    }

    // Webcam input is buffered so early detections can still resolve when the ball
    // enters the hit window shortly after camera/model latency.
    this.bufferedWebcamAction = event.action
    this.bufferedWebcamAtMs = event.timestampMs
  }

  private tryConsumeBufferedWebcamHit(nowMs: number): void {
    if (!this.bufferedWebcamAction) return
    if (this.state !== GameState.BallInFlight || this.shotResolved || !this.currentShot) {
      return
    }

    const ageMs = nowMs - this.bufferedWebcamAtMs
    if (ageMs > WEBCAM_EARLY_BUFFER_MS) {
      this.bufferedWebcamAction = null
      return
    }

    const snapshot = this.currentShot.getSnapshot()
    const inZone = this.isBallOverlappingHitZone(snapshot.x, snapshot.y, snapshot.scale)
    const inLateGrace = nowMs - this.lastHitZoneSeenAtMs <= WEBCAM_LATE_GRACE_MS
    if (!inZone && !inLateGrace) {
      return
    }

    const action = this.bufferedWebcamAction
    this.bufferedWebcamAction = null
    this.attemptHit(action, inLateGrace)
  }

  private tryResolveShotFromInput(action: HitAction, allowLateGraceWindow = false): void {
    if (this.state !== GameState.BallInFlight) return
    if (this.shotResolved) return
    if (!this.currentShot) return

    const snapshot = this.currentShot.getSnapshot()
    const inHitWindow = this.isBallOverlappingHitZone(snapshot.x, snapshot.y, snapshot.scale)
    const laneMatches = this.doesInputMatchTargetLane(action)
    const timingWindowMatches = inHitWindow || allowLateGraceWindow

    if (timingWindowMatches && laneMatches) {
      this.onSuccessfulHit()
      this.beginOutcomeAnimationFromSnapshot(snapshot)
      this.enterState(GameState.HitReturn)
    } else {
      this.onMissedShot()
      this.beginOutcomeAnimationFromSnapshot(snapshot)
      this.prepareMissFallTarget()
      this.enterState(GameState.MissFall)
    }
  }

  private applyShotSnapshot(s: {
    x: number
    y: number
    scale: number
    depth: number
  }): void {
    if (this.previousShotX !== null && this.previousShotY !== null) {
      this.shotMotionX = s.x - this.previousShotX
      this.shotMotionY = s.y - this.previousShotY
    }
    this.previousShotX = s.x
    this.previousShotY = s.y

    this.setBallAndShadow(s.x, s.y, s.scale, s.depth)

    // Flash the same exact zone used by hit validation.
    const inHitWindow = this.isBallOverlappingHitZone(s.x, s.y, s.scale)
    if (inHitWindow) {
      this.lastHitZoneSeenAtMs = performance.now()
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

  private isBallOverlappingHitZone(ballX: number, ballY: number, ballScale: number): boolean {
    const left = this.hitZoneRect.x - HIT_ZONE_WIDTH / 2
    const right = this.hitZoneRect.x + HIT_ZONE_WIDTH / 2
    const top = HIT_ZONE_Y
    const bottom = HIT_ZONE_Y + HIT_ZONE_HEIGHT
    const radius = BALL_RADIUS * Math.max(ballScale, 0)
    const closestX = Phaser.Math.Clamp(ballX, left, right)
    const closestY = Phaser.Math.Clamp(ballY, top, bottom)
    const dx = ballX - closestX
    const dy = ballY - closestY
    return dx * dx + dy * dy <= radius * radius
  }

  private doesInputMatchTargetLane(action: HitAction): boolean {
    // Keep center lane permissive for now so MediaPipe center gesture can be swapped in later.
    if (this.targetLane === 'center') {
      return action === 'left' || action === 'right' || action === 'center'
    }
    return action === this.targetLane
  }

  private beginOutcomeAnimationFromSnapshot(s: { x: number; y: number; scale: number; depth: number }): void {
    this.outcomeStartX = s.x
    this.outcomeStartY = s.y
    this.outcomeStartScale = s.scale
    this.outcomeStartDepth = s.depth
  }

  private prepareMissFallTarget(): void {
    const remainingY = Math.max(1, BALL_MISS_FALL_END_Y - this.outcomeStartY)
    const downwardMotionY = this.shotMotionY > 0.001 ? this.shotMotionY : 1
    const slopeXPerY = this.shotMotionX / downwardMotionY
    const projectedX = this.outcomeStartX + slopeXPerY * remainingY
    this.missFallTargetX = Phaser.Math.Clamp(projectedX, -GAME_WIDTH * 0.35, GAME_WIDTH * 1.35)
  }

  private updateHitReturn(): void {
    const t = Phaser.Math.Clamp(this.stateTimeMs / BALL_RETURN_DURATION_MS, 0, 1)
    const x = Phaser.Math.Linear(this.outcomeStartX, GAME_WIDTH / 2, t)
    const y = Phaser.Math.Linear(this.outcomeStartY, BALL_RETURN_TARGET_Y, t)
    const scale = Phaser.Math.Linear(this.outcomeStartScale, BALL_RETURN_END_SCALE, t)
    const depth = Phaser.Math.Linear(this.outcomeStartDepth, 0, t)
    this.setBallAndShadow(x, y, scale, depth)
    this.ball.setFillStyle(BALL_COLOR)
    if (t >= 1) {
      this.enterState(GameState.ResolvingShot)
    }
  }

  private updateMissFall(): void {
    const t = Phaser.Math.Clamp(this.stateTimeMs / BALL_MISS_FALL_DURATION_MS, 0, 1)
    const x = Phaser.Math.Linear(this.outcomeStartX, this.missFallTargetX, t)
    const y = Phaser.Math.Linear(this.outcomeStartY, BALL_MISS_FALL_END_Y, t)
    const scale = Phaser.Math.Linear(this.outcomeStartScale, this.outcomeStartScale * BALL_MISS_FALL_END_SCALE_MULTIPLIER, t)
    const depth = Phaser.Math.Linear(this.outcomeStartDepth, 1, t)
    this.setBallAndShadow(x, y, scale, depth)
    this.ball.setFillStyle(BALL_COLOR)
    if (t >= 1) {
      this.enterState(GameState.ResolvingShot)
    }
  }

  private setBallAndShadow(x: number, y: number, scale: number, depth: number): void {
    this.ball.setPosition(x, y)
    this.ball.setScale(scale)

    const shadowY = y + Phaser.Math.Linear(SHADOW_Y_OFFSET_MIN, SHADOW_Y_OFFSET_MAX, depth)
    const shadowAlpha = Phaser.Math.Linear(SHADOW_MIN_ALPHA, SHADOW_MAX_ALPHA, depth)
    this.shadow.setPosition(x, shadowY)
    this.shadow.setScale(scale)
    this.shadow.setAlpha(shadowAlpha)
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
