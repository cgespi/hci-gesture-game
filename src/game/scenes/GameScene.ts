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
  MusicRef
} from '../constants.ts'
import { GameState, type GameState as GameStateType } from '../gameplay/GameState'
import { DifficultyManager, type DifficultyConfig, type DifficultyLevel } from '../gameplay/DifficultyManager'
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
const STARTING_DIFFICULTY: DifficultyLevel = 'medium'
const SHOW_DIFFICULTY_DEBUG = true

export class GameScene extends Phaser.Scene {
  private inputController!: InputController
  private difficultyManager!: DifficultyManager

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
  private difficultyDebugText: Phaser.GameObjects.Text | null = null
  private keySpace!: Phaser.Input.Keyboard.Key
  private keyEnter!: Phaser.Input.Keyboard.Key
  private keyEsc!: Phaser.Input.Keyboard.Key

  //moving cannon parameters
  private cannonVelocityX = 80  // pixels per second


  constructor() {
    super({ key: SceneKey.Game })
  }

  create() {
    this.registry.set(RegistryKey.Hits, 0)
    this.registry.set(RegistryKey.Misses, 0)
    this.registry.set(RegistryKey.Lives, STARTING_LIVES)
    this.registry.set(RegistryKey.TargetLane, '—')
    const startingDifficulty = this.resolveStartingDifficultyLevel()
    const difficultyOverrides = this.readDifficultyOverridesFromRegistry()
    this.difficultyManager = new DifficultyManager(startingDifficulty, difficultyOverrides)

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


  // ── Ground base
  this.add
    .rectangle(0, groundTopY, GAME_WIDTH, groundHeight, GROUND_COLOR)
    .setOrigin(0, 0)

  // ── Grass detail 
  this.add
    .rectangle(0, groundTopY, GAME_WIDTH, 12, 0x2d7a2d)
    .setOrigin(0, 0)
    .setDepth(2)



  //----------------//
  // Court lines 
  const court = this.add.graphics().setDepth(3)

  // horizon)
  const vpX = GAME_WIDTH / 2
  const vpY = groundTopY  // horizon = where ground meets sky

  // Court edge X positions at the bottom 
  const leftEdgeNear  = GAME_WIDTH * 0.01
  const rightEdgeNear = GAME_WIDTH * 0.99

  // Singles sideline X positions at the bottom (slightly inset from edge)
  const leftSinglesNear  = GAME_WIDTH * 0.18
  const rightSinglesNear = GAME_WIDTH * 0.82

  // Where those lines meet the net (horizon) 
  const leftEdgeFar    = GAME_WIDTH * 0.22
  const rightEdgeFar   = GAME_WIDTH * 0.78
  const leftSinglesFar = GAME_WIDTH * 0.30
  const rightSinglesFar= GAME_WIDTH * 0.70

  court.lineStyle(2, 0xffffff, 0.6)

  // ── Doubles sidelines (outer edges) ──
  court.beginPath()
  court.moveTo(leftEdgeNear, GAME_HEIGHT)
  court.lineTo(leftEdgeFar, vpY)
  court.strokePath()

  court.beginPath()
  court.moveTo(rightEdgeNear, GAME_HEIGHT)
  court.lineTo(rightEdgeFar, vpY)
  court.strokePath()

  // ── Singles sidelines ──
  court.beginPath()
  court.moveTo(leftSinglesNear, GAME_HEIGHT)
  court.lineTo(leftSinglesFar, vpY)
  court.strokePath()

  court.beginPath()
  court.moveTo(rightSinglesNear, GAME_HEIGHT)
  court.lineTo(rightSinglesFar, vpY)
  court.strokePath()



  //service line (halfway between baseline and net, perspective scaled)
  // 
  const serviceLineY = groundTopY + (GAME_HEIGHT - groundTopY) * 0.45
  const serviceLineLeftX  = Phaser.Math.Linear(leftSinglesFar,  leftSinglesNear,  0.45)
  const serviceLineRightX = Phaser.Math.Linear(rightSinglesFar, rightSinglesNear, 0.45)

  court.lineStyle(2, 0xffffff, 0.5)
  court.beginPath()
  court.moveTo(serviceLineLeftX, serviceLineY)
  court.lineTo(serviceLineRightX, serviceLineY)
  court.strokePath()

  // ── Center service line (T line — from service line to net, perspective) ──
  const centerFarX  = vpX  // at the net it's dead center
  const centerNearX = vpX  // also center (straight line down the middle)
  court.beginPath()
  court.moveTo(centerNearX, serviceLineY)
  court.lineTo(centerFarX, vpY)
  court.strokePath()



  ///--------------------//
  // ── Net
  const net = this.add.graphics().setDepth(4)
  const netX = GAME_WIDTH / 2
  const netTopY = groundTopY - 60   // how tall the net is
  const netBottomY = groundTopY
  const netWidth = GAME_WIDTH*.56

  // Net posts (left and right vertical poles)
  net.lineStyle(4, 0xdddddd, 1)
  net.beginPath()
  net.moveTo(netX - netWidth / 2, netBottomY)
  net.lineTo(netX - netWidth / 2, netTopY)
  net.strokePath()

  net.beginPath()
  net.moveTo(netX + netWidth / 2, netBottomY)
  net.lineTo(netX + netWidth / 2, netTopY)
  net.strokePath()

  // Net top cable
  net.lineStyle(3, 0xffffff, 0.9)
  net.beginPath()
  net.moveTo(netX - netWidth / 2, netTopY)
  net.lineTo(netX + netWidth / 2, netTopY)
  net.strokePath()

  // Net mesh (vertical lines)
  net.lineStyle(1, 0xffffff, 0.4)
  const meshCols = 30

  for (let i = 1; i < meshCols; i++) {
    const x = (netX - netWidth / 2) + (netWidth / meshCols) * i
    net.beginPath()
    net.moveTo(x, netTopY)
    net.lineTo(x, netBottomY)
    net.strokePath()
  }

  // Net mesh (horizontal lines)
  const meshRows = 5
  for (let i = 1; i < meshRows; i++) {
    const y = netTopY + ((netBottomY - netTopY) / meshRows) * i
    net.beginPath()
    net.moveTo(netX - netWidth / 2, y)
    net.lineTo(netX + netWidth / 2, y)
    net.strokePath()
  }

  // ── Clouds #from kenney loaded in bootscene.ts//
  this.add.image(120,  80,  'cloud1').setScale(0.6).setDepth(1).setAlpha(0.9)
  this.add.image(400,  50,  'cloud2').setScale(0.45).setDepth(1).setAlpha(0.85)
  this.add.image(720,  100, 'cloud3').setScale(0.7).setDepth(1).setAlpha(0.9)
  this.add.image(980,  60,  'cloud1').setScale(0.5).setDepth(1).setAlpha(0.8)






  //--------------------

  //--- Side decorations

  // Grass tufts on the sides
  this.add.image(40,  groundTopY + 10, 'grass1').setScale(0.6).setDepth(3)
  this.add.image(100, groundTopY + 10, 'grass2').setScale(0.5).setDepth(3)
  this.add.image(GAME_WIDTH - 40,  groundTopY + 10, 'grass1').setScale(0.6).setDepth(3).setFlipX(true)
  this.add.image(GAME_WIDTH - 100, groundTopY + 10, 'grass2').setScale(0.5).setDepth(3).setFlipX(true)

    // Place cannon directly on the sky/field boundary line.
    const cannonY = groundTopY
    this.cannon = this.add
      .rectangle(GAME_WIDTH / 2, cannonY, CANNON_WIDTH, CANNON_HEIGHT, CANNON_COLOR)
      .setOrigin(0.5, 1)

        // Shadow renders behind the ball and grows as it approaches.
    this.shadow = this.add
      .ellipse(this.cannon.x, this.cannon.y, SHADOW_WIDTH_RADIUS * 2, SHADOW_HEIGHT_RADIUS * 2, SHADOW_COLOR, SHADOW_MIN_ALPHA)
      .setOrigin(0.5, 0.5)
      .setDepth(6)  // above ground (0), grass strip (2), court lines (3), net (4)

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




    // Looping wind ambience or maybe music ?
  if (MusicRef.music){
    if (MusicRef.music.isPlaying){ //is already playing and the game is being restarted
      MusicRef.music.stop()
    }
  } else {//music doesn't exist yet
    MusicRef.music =  this.sound.add('wind', { loop: true, volume: 0.35 })
  }

  if (this.registry.get('musicToggle')){
    MusicRef.music.play();
  }

  // Stop wind when scene shuts down
  this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    this.sound.stopByKey('wind')
  })
    this.scene.bringToTop(SceneKey.UI)
    this.createDifficultyDebugDisplay()

    this.enterState(GameState.Initializing)
  }

  update(_time: number, deltaMs: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc) && !this.scene.isActive(SceneKey.Pause) && this.state != GameState.RoundOver) {
      if (MusicRef.music){
        MusicRef.music.pause()
      }
      this.scene.pause(SceneKey.UI)
      this.scene.launch(SceneKey.Pause)
      this.scene.bringToTop(SceneKey.Pause)
      this.scene.pause()
      return
    }

    const dtMs = Math.min(deltaMs, 50)
    this.stateTimeMs += dtMs
        // Move cannon left/right, bounce off edges
    const cannonHalfWidth = CANNON_WIDTH / 2
    const cannonMinX = GAME_WIDTH * 0.22 + cannonHalfWidth
    const cannonMaxX = GAME_WIDTH * 0.78 - cannonHalfWidth

    this.cannon.x += this.cannonVelocityX * (dtMs / 1000)
    if (this.cannon.x >= cannonMaxX) {
      this.cannon.x = cannonMaxX
      this.cannonVelocityX = -Math.abs(this.cannonVelocityX)
    }
    if (this.cannon.x <= cannonMinX) {
      this.cannon.x = cannonMinX
      this.cannonVelocityX = Math.abs(this.cannonVelocityX)
    }

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
        if (this.stateTimeMs >= this.getCurrentLaunchDelayMs()) {
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
        if (this.stateTimeMs >= this.getCurrentLaunchDelayMs()) {
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
    this.refreshDifficultyDebugDisplay()
  }

  private enterState(next: GameStateType): void {
    this.state = next
    this.stateTimeMs = 0

    if (next !== GameState.BallInFlight && next !== GameState.HitReturn && next !== GameState.MissFall) {
      // Reset transient shot visuals when leaving flight.
      this.currentShotInHitWindow = false
      this.hitZoneRect.setFillStyle(HIT_ZONE_COLOR, HIT_ZONE_FILL_ALPHA)
      this.ball.setFillStyle(BALL_COLOR)
      this.shadow.setAlpha(0)  // hide shadow immediately on resolution
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
      durationMs: this.computeShotDurationMs(this.difficultyManager.getCurrentLaunchSpeed()),
      endpoints: {
        start,
        control,
        end,
      },
      minScale: BALL_MIN_SCALE,
      maxScale: BALL_MAX_SCALE,
    })
    this.sound.play('ball_shoot', { volume: 0.5 })
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

      const groundTopY = GAME_HEIGHT - Math.round(GAME_HEIGHT * GROUND_HEIGHT_RATIO)
      
      // Shadow Y travels from near the net (horizon) down toward the bottom of the screen
      // as the ball approaches, matching the ball's X position
      const shadowY = Phaser.Math.Linear(groundTopY + 5, GAME_HEIGHT - 20, depth)

      // Shadow grows and darkens as ball gets closer
      const shadowScale = Phaser.Math.Linear(.5, .5, depth)
      const shadowAlpha = Phaser.Math.Linear(0.05, 0.5, depth)

      this.shadow.setPosition(x, shadowY)
      this.shadow.setScale(shadowScale)
      this.shadow.setAlpha(shadowAlpha)
    }

  private onSuccessfulHit(): void {
    this.shotResolved = true

    //sfx
    this.sound.play('ball_hit', { volume: 0.7 })
    this.sound.play('hit_success', { volume: 0.4 })
    //
    const hits = this.getHits()
    this.registry.set(RegistryKey.Hits, hits + 1)
    this.difficultyManager.updateOnHit()
  }

  private onMissedShot(): void {
    this.shotResolved = true
    this.sound.play('ball_miss', { volume: 0.3 })
    const misses = this.getMisses()
    this.registry.set(RegistryKey.Misses, misses + 1)

    const lives = this.getLives()
    if (!this.registry.get('endlessMode')){
      this.registry.set(RegistryKey.Lives, Math.max(0, lives - 1))
    }
    this.difficultyManager.updateOnMiss()
  }

  private resolveStartingDifficultyLevel(): DifficultyLevel {
    const rawDifficulty = this.registry.get(RegistryKey.Difficulty)
    if (typeof rawDifficulty !== 'string') return STARTING_DIFFICULTY

    const normalized = rawDifficulty.trim().toLowerCase()
    if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
      return normalized
    }
    return STARTING_DIFFICULTY
  }

  private readDifficultyOverridesFromRegistry(): Partial<DifficultyConfig> {
    const overrides: Partial<DifficultyConfig> = {}
    const growth = this.readNumericRegistryValue(RegistryKey.GrowthSpeed)
    if (growth !== undefined) {
      overrides.difficultyGrowth = growth
    }

    const streakThreshold = this.readNumericRegistryValue(RegistryKey.StreakThreshhold)
    if (streakThreshold !== undefined) {
      overrides.streakThreshold = streakThreshold
    }

    const launchDelaySeconds = this.readNumericRegistryValue(RegistryKey.LaunchDelay)
    if (launchDelaySeconds !== undefined) {
      overrides.startingLaunchDelay = launchDelaySeconds * 1000
    }

    const legacyBallSpeed = this.readNumericRegistryValue(RegistryKey.BallSpeed)
    if (legacyBallSpeed !== undefined) {
      overrides.startingLaunchSpeed = this.mapLegacyBallSpeedToLaunchSpeed(legacyBallSpeed)
    }

    return overrides
  }

  private readNumericRegistryValue(key: string): number | undefined {
    const value = this.registry.get(key)
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      return undefined
    }
    return value
  }

  private mapLegacyBallSpeedToLaunchSpeed(ballSpeed: number): number {
    if (ballSpeed <= 1) return 0.85
    if (ballSpeed <= 2) return 1
    return 1.2
  }

  private getCurrentLaunchDelayMs(): number {
    return this.difficultyManager.getCurrentLaunchDelayMs()
  }

  private computeShotDurationMs(launchSpeed: number): number {
    const durationMs = SHOT_DURATION_MS / Math.max(launchSpeed, 0.1)
    return Phaser.Math.Clamp(durationMs, 280, 2400)
  }

  private createDifficultyDebugDisplay(): void {
    if (!SHOW_DIFFICULTY_DEBUG) return
    this.difficultyDebugText = this.add
      .text(GAME_WIDTH - 12, 12, '', {
        fontSize: '14px',
        color: '#ffffff',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(1200)
      .setScrollFactor(0)
    this.refreshDifficultyDebugDisplay()
  }

  private refreshDifficultyDebugDisplay(): void {
    if (!this.difficultyDebugText) return
    const snapshot = this.difficultyManager.getSnapshot()
    this.difficultyDebugText.setText([
      '[debug] Dynamic Difficulty',
      `Level: ${snapshot.currentDifficultyLevel}`,
      `Launch speed: ${snapshot.currentLaunchSpeed.toFixed(2)}x`,
      `Launch delay: ${Math.round(snapshot.currentLaunchDelay)}ms`,
      `Hit streak: ${snapshot.hitStreak}/${snapshot.streakThreshold}`,
      `Miss count: ${snapshot.missCount}`,
      `Growth: ${(snapshot.difficultyGrowth * 100).toFixed(0)}%`,
    ])
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
