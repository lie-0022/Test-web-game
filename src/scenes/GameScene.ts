import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// Ghost Racers — 1단계 코어 무브 슬라이스.
// 터치 조향으로 네온 트레일을 남기며 일일 시드 트랙을 달린다.
// 벽/장애물에 부딪히면 와이프 후 리셋. 백엔드 없음(고스트/리플레이는 이후 단계).

// 결정론적 RNG (mulberry32). 같은 시드 → 같은 트랙. 일일 시드의 토대.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 오늘 날짜(YYYYMMDD)를 시드로. 같은 날 = 같은 트랙 → 공통 화젯거리/리더보드의 토대.
function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SPEED = 180; // px/s
const TURN_RATE = 3.4; // rad/s
const TRAIL_MAX = 600; // 트레일 점 상한 (고정 길이, 프레임당 할당 0 지향)

export class GameScene extends Phaser.Scene {
  private seed = 0;
  private obstacles: Rect[] = [];
  private trail: number[] = []; // [x0,y0, x1,y1, ...] flat array
  private px = 0;
  private py = 0;
  private heading = 0;
  private elapsed = 0;
  private dead = false;
  private trackGfx!: Phaser.GameObjects.Graphics;
  private trailGfx!: Phaser.GameObjects.Graphics;
  private ship!: Phaser.GameObjects.Triangle;
  private hud!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.seed = dailySeed();
    this.buildTrack(this.seed);

    this.trackGfx = this.add.graphics();
    this.trailGfx = this.add.graphics();
    this.ship = this.add.triangle(0, 0, 0, -7, -5, 6, 5, 6, 0x39ff14).setOrigin(0.5);

    this.hud = this.add
      .text(8, 8, '', { fontFamily: 'monospace', fontSize: '14px', color: '#9be7ff' })
      .setDepth(10);

    this.drawTrack();
    this.respawn();
  }

  // 일일 시드로 장애물 배치. 스타트 구역(하단)은 비워둔다.
  private buildTrack(seed: number): void {
    const rng = mulberry32(seed);
    this.obstacles = [];
    const count = 5 + Math.floor(rng() * 4);
    for (let i = 0; i < count; i++) {
      const w = 50 + rng() * 90;
      const h = 24 + rng() * 60;
      const x = 30 + rng() * (GAME_WIDTH - 60 - w);
      const y = 80 + rng() * (GAME_HEIGHT - 320); // 하단 스타트 구역 회피
      this.obstacles.push({ x, y, w, h });
    }
  }

  private drawTrack(): void {
    const g = this.trackGfx;
    g.clear();
    g.lineStyle(3, 0x2a2a44, 1).strokeRect(4, 4, GAME_WIDTH - 8, GAME_HEIGHT - 8);
    g.fillStyle(0x1b2a4a, 1).lineStyle(2, 0x3d5a9a, 1);
    for (const o of this.obstacles) {
      g.fillRect(o.x, o.y, o.w, o.h).strokeRect(o.x, o.y, o.w, o.h);
    }
  }

  private respawn(): void {
    this.px = GAME_WIDTH / 2;
    this.py = GAME_HEIGHT - 60;
    this.heading = -Math.PI / 2; // 위쪽
    this.trail.length = 0;
    this.elapsed = 0;
    this.dead = false;
    this.cameras.main.setBackgroundColor('#0d0d12');
  }

  update(_t: number, deltaMs: number): void {
    if (this.dead) return;
    const dt = Math.min(deltaMs, 50) / 1000; // 스파이크 클램프
    this.elapsed += dt;

    // 터치 조향: 화면 좌/우 절반을 누르면 회전. 떼면 직진.
    const p = this.input.activePointer;
    if (p.isDown) {
      this.heading += (p.x < GAME_WIDTH / 2 ? -1 : 1) * TURN_RATE * dt;
    }

    this.px += Math.cos(this.heading) * SPEED * dt;
    this.py += Math.sin(this.heading) * SPEED * dt;

    if (this.hitWall() || this.hitObstacle()) {
      this.wipe();
      return;
    }

    // 트레일 기록 (고정 상한, 초과 시 앞에서 버림).
    this.trail.push(this.px, this.py);
    if (this.trail.length > TRAIL_MAX * 2) this.trail.splice(0, 2);

    this.drawTrail();
    this.ship.setPosition(this.px, this.py).setRotation(this.heading + Math.PI / 2);
    this.hud.setText(`SEED ${this.seed}\nTIME ${this.elapsed.toFixed(1)}s`);
  }

  private hitWall(): boolean {
    return this.px < 6 || this.px > GAME_WIDTH - 6 || this.py < 6 || this.py > GAME_HEIGHT - 6;
  }

  private hitObstacle(): boolean {
    for (const o of this.obstacles) {
      if (this.px > o.x && this.px < o.x + o.w && this.py > o.y && this.py < o.y + o.h) return true;
    }
    return false;
  }

  private drawTrail(): void {
    const g = this.trailGfx;
    g.clear();
    if (this.trail.length < 4) return;
    g.lineStyle(3, 0x39ff14, 0.9);
    g.beginPath();
    g.moveTo(this.trail[0], this.trail[1]);
    for (let i = 2; i < this.trail.length; i += 2) g.lineTo(this.trail[i], this.trail[i + 1]);
    g.strokePath();
  }

  private wipe(): void {
    this.dead = true;
    this.cameras.main.setBackgroundColor('#3a0d14');
    this.cameras.main.shake(150, 0.01);
    this.time.delayedCall(500, () => this.respawn());
  }
}
