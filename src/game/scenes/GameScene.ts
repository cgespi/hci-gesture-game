import Phaser from 'phaser'
import {
  BALL_COLOR,
  BALL_RADIUS,
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
  laneX,
  type Lane,
  RegistryKey,
  RESET_DELAY_MS,
  SceneKey,
  SHOT_TRAVEL_MS,
  SKY_COLOR,
  STARTING_LIVES,
} from '../constants.ts'
import { GameState, type GameState as GameStateType } from '../gameplay/GameState'
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

  private hitZoneRect!: Phaser.GameObjects.Rectangle
  private hitZoneLabel!: Phaser.GameObjects.Text

  private targetLane: Lane = 'center'
  private shotTween: Phaser.Tweens.Tween | null = null
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

    this.ball = this.add.circle(this.cannon.x, this.cannon.y - CANNON_HEIGHT - BALL_RADIUS, BALL_RADIUS, BALL_COLOR)

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
        // If the tween finished without resolution, it’s a late miss.
        if (this.shotTween && !this.shotTween.isPlaying() && !this.shotResolved) {
          this.onMissedShot()
          this.enterState(GameState.ResolvingShot)
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
    if (this.shotTween) {
      this.shotTween.stop()
      this.shotTween = null
    }

    const lanes: Lane[] = ['left', 'center', 'right']
    this.targetLane = Phaser.Utils.Array.GetRandom(lanes)
    this.registry.set(RegistryKey.TargetLane, this.targetLane)

    const x = laneX(this.targetLane)
    this.hitZoneRect.setX(x)
    this.hitZoneLabel.setX(x)

    // Reset ball to cannon mouth.
    this.ball.setPosition(this.cannon.x, this.cannon.y - CANNON_HEIGHT - BALL_RADIUS)

    // Travel upward/outward toward lane; finish slightly above the hit zone so “late” is clear.
    this.shotTween = this.tweens.add({
      targets: this.ball,
      x,
      y: HIT_ZONE_Y - BALL_RADIUS * 2,
      duration: SHOT_TRAVEL_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.shotResolved) return
        this.onMissedShot()
        this.enterState(GameState.ResolvingShot)
      },
    })
  }

  private tryResolveShotFromInput(action: 'left' | 'center' | 'right'): void {
    if (this.state !== GameState.BallInFlight) return
    if (this.shotResolved) return

    const isOverlapping = Phaser.Geom.Intersects.RectangleToRectangle(this.ball.getBounds(), this.hitZoneRect.getBounds())

    const laneMatches =
      this.targetLane === 'center'
        ? action === 'left' || action === 'right' || action === 'center'
        : action === this.targetLane

    if (isOverlapping && laneMatches) {
      this.onSuccessfulHit()
    } else {
      this.onMissedShot()
    }

    this.enterState(GameState.ResolvingShot)
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
