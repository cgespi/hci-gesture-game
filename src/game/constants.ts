/**
 * Shared numbers and string keys so scenes stay in sync without magic literals.
 */

export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

// --- Ping-pong table (2D perspective): far = top of screen, near = bottom ---

/** Screen Y of the far end of the table (opponent side). */
export const TABLE_TOP_Y = 130
/** Screen Y of the near end of the table (player side). */
export const TABLE_BOTTOM_Y = GAME_HEIGHT - 50
/** Half-width of the table surface at the far end (pixels). */
export const TABLE_TOP_HALF_WIDTH = 88
/** Half-width of the table surface at the near end (pixels). */
export const TABLE_BOTTOM_HALF_WIDTH = 300

/** Horizontal placement for left/right lanes: fraction of local half-width (0–1). */
export const LANE_OFFSET = 0.72

/** Depth (0 = far, 1 = near) where the net is drawn across the table. */
export const NET_T = 0.52

// --- Gameplay tuning ---

export const INTERMISSION_SECONDS = 0.6
export const MISSED_SECONDS = 0.85
export const INCOMING_SPEED_Z_PER_SEC = 0.55
export const RETURN_SPEED_Z_PER_SEC = 0.8

/**
 * Hit window in depth: ball must be between these t values for a valid return.
 * Higher t = closer to the player. Narrower gap = harder timing.
 */
export const HIT_ZONE_T0 = 0.72
export const HIT_ZONE_T1 = 0.92

export const MAX_MISSES = 3

// --- Ball visuals ---

export const BALL_MIN_RADIUS = 6
export const BALL_MAX_RADIUS = 34
export const BALL_COLOR = 0xffe66d
/** 1 = linear depth mapping; >1 exaggerates motion near the player. */
export const BALL_EASE_POWER = 1

export const BALL_SHADOW_ALPHA = 0.35
/** Pixels below the ball center for the fake “contact shadow” on the table. */
export const BALL_SHADOW_Y_OFFSET = 4
export const BALL_SHADOW_SCALE_X = 1.35
export const BALL_SHADOW_SCALE_Y = 0.42

// --- Draw order (Phaser display list depth) ---

export const DEPTH_ROOM_BG = -2
export const DEPTH_TABLE = 0
export const DEPTH_HIT_BAND = 2
export const DEPTH_NET = 6
/** Ball while t < NET_T (still “past” the net from the camera). */
export const DEPTH_BALL_BEHIND_NET = 4
/** Ball while t >= NET_T (crossed toward the player, draws over the net). */
export const DEPTH_BALL_IN_FRONT_OF_NET = 10

// --- Table / net colors (hex) ---

export const COLOR_ROOM_BG = 0x151525
export const COLOR_TABLE_SURFACE = 0x1a6b45
export const COLOR_TABLE_LINE = 0xffffff
export const COLOR_NET_MESH = 0xffffff
export const COLOR_NET_TOP = 0xeeeeee

/** Scene keys passed to `super({ key })` and `this.scene.start(...)`. */
export const SceneKey = {
  Boot: 'Boot',
  Menu: 'Menu',
  Game: 'Game',
  UI: 'UI',
} as const

/** Registry keys for values shared between scenes (e.g. Game writes, UI reads). */
export const RegistryKey = {
  /** Current player score (number). */
  Score: 'score',
  /** Number of misses this round (number). */
  Misses: 'misses',
} as const
