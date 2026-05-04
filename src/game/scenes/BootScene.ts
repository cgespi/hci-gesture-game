import Phaser from 'phaser'
import { SceneKey } from '../constants.ts'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Boot })
  }

  preload() {
  this.load.image('cloud1', 'background/PNG/cloud1.png')
  this.load.image('cloud2', 'background/PNG/cloud2.png')
  this.load.image('cloud3', 'background/PNG/cloud3.png')

  //barrel nozzle
  this.load.image('barrel', 'assets/barrel.png')


  //sides
  this.load.image('fence', 'background/PNG/fence.png')
  this.load.image('grass1', 'background/PNG/grass1.png')
  this.load.image('grass2', 'background/PNG/grass2.png')


  // Sound effects
  this.load.audio('ball_shoot', 'sfx/canon_shoot1.mp3')
  this.load.audio('menu_click', 'sfx/menu_click.mp3')
  this.load.audio('ball_miss',  'sfx/miss1.mp3')
  this.load.audio('ball_hit',   'sfx/tennis_hit1.mp3')
  this.load.audio('wind',       'sfx/wind_ambience.mp3')//replaced with some game music 
  this.load.audio('hit_success', 'sfx/hit_confirm1.mp3')
  }

  create() {
    this.scene.start(SceneKey.Menu)
  }
}