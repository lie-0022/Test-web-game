import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { GameScene } from './scenes/GameScene';

// 모든 콘셉 브랜치가 공유하는 부트스트랩.
// 콘셉별 코어 루프는 src/scenes/GameScene.ts 한 파일만 교체한다.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d0d12',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [GameScene],
});
