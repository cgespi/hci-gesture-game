import Phaser from 'phaser'
import { SceneKey } from '../constants.ts'

/**
 * First scene that runs when the game starts.
 * Later you can add preload() here to load images and sounds.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Boot })
  }

  create() {
    this.scene.start(SceneKey.Menu)
  }
}
