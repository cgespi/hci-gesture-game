/**
 * Shared numbers and string keys so scenes stay in sync without magic literals.
 */

export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

/**
 * Fake first-person perspective for the 2D court (no real 3D).
 *
 * - Depth `zNorm` in [0, 1]: 0 = far (opponent / top of screen), 1 = near (player / below screen).
 * - Y uses a power curve so most “table length” is compressed toward the player; `overscanBottom`
 *   pushes the near baseline past the bottom edge so the player feels standing on the court.
 * - Width grows with the same eased parameter so sidelines meet at a vanishing band near `horizonY`.
 */
export const COURT_PERSPECTIVE = {
  /** Horizon as a fraction of screen height (smaller = table vanishes higher). */
  horizonYRatio: 0.18,
  /** Pixels past the canvas bottom for zNorm = 1 (near edge off-screen). */
  overscanBottom: 220,
  /** Full court width in pixels at the far end (narrow = strong perspective). */
  farCourtWidth: GAME_WIDTH * 0.22,
  /** Full court width at the near end (may exceed canvas). */
  nearCourtWidth: GAME_WIDTH * 1.05,
  /** Shared exponent on zNorm for Y and width ( >1 exaggerates the near half ). */
  depthExponent: 1.7,
  /** Horizontal guide stripes; evenly spaced in court zNorm, not in screen Y. */
  depthStripeCount: 5,
  /** Service / guide lines: depth slices parallel to the net (court zNorm). */
  serviceLineZ0: 0.32,
  serviceLineZ1: 0.68,
} as const

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
/** Kept for API compatibility; ball motion follows {@link COURT_PERSPECTIVE} projection. */
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
