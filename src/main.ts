import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { IntroScene } from './scenes/IntroScene'
import { OfficeScene } from './scenes/OfficeScene'
import { AlleyScene } from './scenes/AlleyScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#000000',
  scene: [BootScene, IntroScene, OfficeScene, AlleyScene],
  render: {
    antialias: true,
    pixelArt: false,
  },
}

new Phaser.Game(config)
