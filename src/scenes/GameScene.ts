import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// 공통 스캐폴딩의 플레이스홀더 씬.
// 콘셉 브랜치(concept/*)에서는 이 파일이 각 게임의 코어 루프로 교체된다.
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Scaffold Ready\n공통 베이스 브랜치', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
