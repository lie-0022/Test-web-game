import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// Ghost Racers — 2단계: 결승선 + 랩 타임 + 베스트 기록 + 재시작 루프.
// 하단에서 출발해 상단 결승선까지. 탭으로 시작, 완주/충돌 후 탭으로 재시작.
// 베스트 타임은 시드(일일 트랙)별로 localStorage에 저장.

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
const FINISH_Y = 56; // 이보다 위로 가면 완주

type Phase = 'idle' | 'running' | 'dead';

// iOS Safari 사생활 보호 모드는 localStorage 접근에서 throw — 기록만 포기하고 진행.
function loadBest(seed: number): number {
  try {
    return Number(localStorage.getItem(`gr-best-${seed}`)) || 0;
  } catch {
    return 0;
  }
}
function saveBest(seed: number, t: number): void {
  try {
    localStorage.setItem(`gr-best-${seed}`, String(t));
  } catch {
    /* 무시 */
  }
}

export class GameScene extends Phaser.Scene {
  private seed = 0;
  private obstacles: Rect[] = [];
  private trail: number[] = []; // [x0,y0, x1,y1, ...] flat array
  private px = 0;
  private py = 0;
  private heading = 0;
  private elapsed = 0;
  private phase: Phase = 'idle';
  private trackGfx!: Phaser.GameObjects.Graphics;
  private trailGfx!: Phaser.GameObjects.Graphics;
  private ship!: Phaser.GameObjects.Triangle;
  private hud!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Text;

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

    this.overlay = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: 'rgba(13,13,18,0.85)',
        padding: { x: 18, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.drawTrack();
    this.input.on('pointerdown', () => {
      if (this.phase === 'idle') this.startRun();
    });
    this.showIdle('GHOST RACERS\n\n왼쪽 터치 = 좌회전\n오른쪽 터치 = 우회전\n\n탭해서 출발!');
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
    // 결승선: 체커무늬 밴드
    for (let x = 4, i = 0; x < GAME_WIDTH - 4; x += 16, i++) {
      g.fillStyle(i % 2 === 0 ? 0xffffff : 0x222230, 1);
      g.fillRect(x, FINISH_Y - 16, Math.min(16, GAME_WIDTH - 4 - x), 16);
    }
    g.fillStyle(0x1b2a4a, 1).lineStyle(2, 0x3d5a9a, 1);
    for (const o of this.obstacles) {
      g.fillRect(o.x, o.y, o.w, o.h).strokeRect(o.x, o.y, o.w, o.h);
    }
  }

  private showIdle(message: string): void {
    this.phase = 'idle';
    this.resetShip();
    this.overlay.setText(message).setVisible(true);
    const best = loadBest(this.seed);
    this.hud.setText(`SEED ${this.seed}\nBEST ${best ? best.toFixed(2) + 's' : '--'}`);
  }

  private resetShip(): void {
    this.px = GAME_WIDTH / 2;
    this.py = GAME_HEIGHT - 60;
    this.heading = -Math.PI / 2; // 위쪽
    this.ship.setPosition(this.px, this.py).setRotation(0);
    this.cameras.main.setBackgroundColor('#0d0d12');
  }

  private startRun(): void {
    this.resetShip();
    this.trail.length = 0;
    this.trailGfx.clear();
    this.elapsed = 0;
    this.overlay.setVisible(false);
    this.phase = 'running';
  }

  update(_t: number, deltaMs: number): void {
    if (this.phase !== 'running') return;
    const dt = Math.min(deltaMs, 50) / 1000; // 스파이크 클램프
    this.elapsed += dt;

    // 터치 조향: 화면 좌/우 절반을 누르면 회전. 떼면 직진.
    const p = this.input.activePointer;
    if (p.isDown) {
      this.heading += (p.x < GAME_WIDTH / 2 ? -1 : 1) * TURN_RATE * dt;
    }

    this.px += Math.cos(this.heading) * SPEED * dt;
    this.py += Math.sin(this.heading) * SPEED * dt;

    if (this.py < FINISH_Y) {
      this.finish();
      return;
    }
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
    return this.px < 6 || this.px > GAME_WIDTH - 6 || this.py > GAME_HEIGHT - 6;
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

  private finish(): void {
    const t = this.elapsed;
    const prev = loadBest(this.seed);
    let msg = `FINISH!  ${t.toFixed(2)}s`;
    if (!prev || t < prev) {
      saveBest(this.seed, t);
      msg += prev ? `\nNEW BEST! (이전 ${prev.toFixed(2)}s)` : '\nNEW BEST!';
    } else {
      msg += `\nBEST ${prev.toFixed(2)}s`;
    }
    this.cameras.main.flash(200, 57, 255, 20);
    this.showIdle(`${msg}\n\n탭해서 재도전`);
  }

  private wipe(): void {
    this.phase = 'dead';
    this.cameras.main.setBackgroundColor('#3a0d14');
    this.cameras.main.shake(150, 0.01);
    this.time.delayedCall(450, () =>
      this.showIdle(`CRASH!  ${this.elapsed.toFixed(2)}s\n\n탭해서 재시작`),
    );
  }
}
