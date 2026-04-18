export const GameState = {
  Intermission: 'Intermission',
  BallIncoming: 'BallIncoming',
  HitWindow: 'HitWindow',
  BallReturned: 'BallReturned',
  MissedBall: 'MissedBall',
  RoundOver: 'RoundOver',
} as const

export type GameState = (typeof GameState)[keyof typeof GameState]

