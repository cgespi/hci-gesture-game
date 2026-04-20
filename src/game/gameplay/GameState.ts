export const GameState = {
  PreparingShot: 'PreparingShot',
  BallInFlight: 'BallInFlight',
  ResolvingShot: 'ResolvingShot',
  RoundOver: 'RoundOver',
} as const

export type GameState = (typeof GameState)[keyof typeof GameState]

