import './style.css'
import Phaser from 'phaser'
import { createGameConfig } from './game/config.ts'

// We bootstrap Phaser from one entry point so scene wiring stays centralized in createGameConfig().
new Phaser.Game(createGameConfig())
