/**
 * Shared numbers and string keys so scenes stay in sync without magic literals.
 */

export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

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
