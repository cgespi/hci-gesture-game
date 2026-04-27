export const GameState = {
  PreparingShot: 'PreparingShot',
  BallInFlight: 'BallInFlight',
  HitReturn: 'HitReturn',
  MissFall: 'MissFall',
  ResolvingShot: 'ResolvingShot',
  RoundOver: 'RoundOver',
} as const

export type GameState = (typeof GameState)[keyof typeof GameState]

