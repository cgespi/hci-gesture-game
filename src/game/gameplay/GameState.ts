/**
 * We model gameplay as an explicit state machine so timing/input rules stay predictable.
 */
export const GameState = {
  Initializing: 'Initializing',
  PreparingShot: 'PreparingShot',
  BallInFlight: 'BallInFlight',
  HitReturn: 'HitReturn',
  MissFall: 'MissFall',
  ResolvingShot: 'ResolvingShot',
  RoundOver: 'RoundOver',
} as const

/** Union type used by GameScene to keep transitions type-safe. */
export type GameState = (typeof GameState)[keyof typeof GameState]

