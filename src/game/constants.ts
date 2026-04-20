/**
 * Shared numbers and string keys so scenes stay in sync without magic literals.
 */

export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

// --- Cannon reaction prototype tuning ---

export const SKY_COLOR = 0x2b80c9
export const GROUND_COLOR = 0x2f6b3f
/** Bottom third is ground; top two-thirds is sky. */
export const GROUND_HEIGHT_RATIO = 1 / 3

export const STARTING_LIVES = 3

/** Delay after each shot resolves before the next shot fires. */
export const RESET_DELAY_MS = 600

/** How long the ball takes to travel from cannon to beyond the hit zone. */
export const SHOT_TRAVEL_MS = 900

/** Ball visuals. */
export const BALL_RADIUS = 12
export const BALL_COLOR = 0xffe66d

/** Cannon visuals. */
export const CANNON_COLOR = 0x8a8a8a
export const CANNON_WIDTH = 34
export const CANNON_HEIGHT = 24

/** Hit zone visuals + tuning. */
export const DEBUG_SHOW_HIT_ZONE = true
export const HIT_ZONE_FILL_ALPHA = 0.22
export const HIT_ZONE_STROKE_ALPHA = 0.85
export const HIT_ZONE_WIDTH = 210
export const HIT_ZONE_HEIGHT = 130
export const HIT_ZONE_COLOR = 0x00ff66
/** Y position (top-left) of the lane hit zone rectangle. */
export const HIT_ZONE_Y = Math.round(GAME_HEIGHT * 0.22)

export type Lane = 'left' | 'center' | 'right'

export function laneX(lane: Lane): number {
  const center = GAME_WIDTH / 2
  const offset = GAME_WIDTH * 0.24
  if (lane === 'left') return center - offset
  if (lane === 'right') return center + offset
  return center
}

/** Scene keys passed to `super({ key })` and `this.scene.start(...)`. */
export const SceneKey = {
  Boot: 'Boot',
  Menu: 'Menu',
  Game: 'Game',
  UI: 'UI',
} as const

/** Registry keys for values shared between scenes (e.g. Game writes, UI reads). */
export const RegistryKey = {
  /** Number of correct hits (number). */
  Hits: 'hits',
  /** Number of misses (number). */
  Misses: 'misses',
  /** Remaining lives (number). */
  Lives: 'lives',
  /** Current target lane label (string). */
  TargetLane: 'targetLane',
} as const
