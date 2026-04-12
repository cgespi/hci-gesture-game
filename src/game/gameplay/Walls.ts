import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants.ts'

const WALL_THICKNESS = 14
const WALL_COLOR = 0x2c2c54

export type BoundaryWalls = {
  /** Static bodies for the top and side edges (bottom stays open for “out of play”). */
  group: Phaser.Physics.Arcade.StaticGroup
}

/**
 * Builds three static rectangles: top, left, and right. The bottom of the screen stays open
 * so the ball can fall “out” and be reset without fighting world bounds.
 */
export function createBoundaryWalls(scene: Phaser.Scene): BoundaryWalls {
  const group = scene.physics.add.staticGroup()

  const top = scene.add.rectangle(GAME_WIDTH / 2, WALL_THICKNESS / 2, GAME_WIDTH, WALL_THICKNESS, WALL_COLOR)
  scene.physics.add.existing(top, true)
  group.add(top)

  const left = scene.add.rectangle(WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT, WALL_COLOR)
  scene.physics.add.existing(left, true)
  group.add(left)

  const right = scene.add.rectangle(
    GAME_WIDTH - WALL_THICKNESS / 2,
    GAME_HEIGHT / 2,
    WALL_THICKNESS,
    GAME_HEIGHT,
    WALL_COLOR,
  )
  scene.physics.add.existing(right, true)
  group.add(right)

  return { group }
}
