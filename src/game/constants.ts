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

/** How long the ball takes to travel from far (cannon) to near (player). */
export const SHOT_DURATION_MS = 1400

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
export const HIT_ZONE_Y = Math.round(GAME_HEIGHT * 0.64)

export type Lane = 'left' | 'center' | 'right'

export function laneX(lane: Lane): number {
  const center = GAME_WIDTH / 2
  const offset = GAME_WIDTH * 0.24
  if (lane === 'left') return center - offset
  if (lane === 'right') return center + offset
  return center
}

// --- Pseudo-perspective tuning (2D “coming toward camera”) ---

/** Ball starts small at the cannon, grows as it approaches the player. */
export const BALL_MIN_SCALE = 0.24
export const BALL_MAX_SCALE = 1.55

/**
 * Depth window during which a hit is considered “on time”.
 * This is checked against the shot’s eased depth (0..1).
 */
export const HIT_DEPTH_WINDOW_START = 0.74
export const HIT_DEPTH_WINDOW_END = 0.97

/** Optional visual cue: make ball brighter during the hit window. */
export const BALL_HIT_WINDOW_COLOR = 0xffffff

// --- Shot arc tuning (faux 3D lob) ---

/**
 * Controls how much the shot “lobs” upward before coming down toward the player.
 * Bigger = higher arc (more dramatic).
 */
export const SHOT_ARC_HEIGHT_PX = 160

/**
 * Where along the left-right travel the arc peak sits (0..1).
 * Smaller values peak earlier (more “cannon pop”); larger values peak later.
 */
export const SHOT_ARC_PEAK_T = 0.35

/**
 * Lane travel endpoints in screen pixels.
 * Far points should be near the cannon/horizon, near points near the reaction zone.
 */
export const LANE_FAR_POINTS: Record<Lane, { x: number; y: number }> = {
  left: { x: laneX('left'), y: Math.round(GAME_HEIGHT * 0.48) },
  center: { x: laneX('center'), y: Math.round(GAME_HEIGHT * 0.48) },
  right: { x: laneX('right'), y: Math.round(GAME_HEIGHT * 0.48) },
}

export const LANE_NEAR_POINTS: Record<Lane, { x: number; y: number }> = {
  left: { x: laneX('left'), y: HIT_ZONE_Y + Math.round(HIT_ZONE_HEIGHT * 0.72) },
  center: { x: laneX('center'), y: HIT_ZONE_Y + Math.round(HIT_ZONE_HEIGHT * 0.72) },
  right: { x: laneX('right'), y: HIT_ZONE_Y + Math.round(HIT_ZONE_HEIGHT * 0.72) },
}

// --- Optional pseudo-3D shadow (simple ellipse) ---

export const SHADOW_COLOR = 0x000000
export const SHADOW_MIN_ALPHA = 0.12
export const SHADOW_MAX_ALPHA = 0.26
export const SHADOW_WIDTH_RADIUS = BALL_RADIUS * 1.25
export const SHADOW_HEIGHT_RADIUS = BALL_RADIUS * 0.45
export const SHADOW_Y_OFFSET_MIN = 8
export const SHADOW_Y_OFFSET_MAX = 18

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
