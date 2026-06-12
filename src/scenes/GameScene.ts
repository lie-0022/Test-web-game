import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// Ghost Racers — 3단계: 긴 스크롤 맵 + 고스트 리플레이.
// 카메라가 플레이어를 따라 위로 전진. 맨 위 결승선까지 긴 트랙을 달린다.
// 완주하면 그 주행 경로를 시드별로 저장 → 다음 시도에 베스트 런의 '고스트'가 함께 달린다.

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
const TRAIL_MAX = 500; // 플레이어 트레일 꼬리 점 상한
const WORLD_HEIGHT = 3200; // 긴 세로 맵 (화면 ~3.7배)
const FINISH_Y = 56; // 이보다 위로 가면 완주
const START_Y = WORLD_HEIGHT - 60;
const REC_DT = 1 / 30; // 고스트 경로 샘플 간격(초)

type Phase = 'idle' | 'running' | 'dead';

// iOS Safari 사생활 보호 모드는 localStorage 접근에서 throw — 기록만 포기하고 진행.
function loadBest(seed: number): number {
  try {
    return Number(localStorage.getItem(`gr-best-${seed}`)) || 0;
  } catch {
    return 0;
  }
}
function loadGhost(seed: number): number[] | null {
  try {
    const raw = localStorage.getItem(`gr-ghost-${seed}`);
    return raw ? (JSON.parse(raw) as number[]) : null;
  } catch {
    return null;
  }
}
function saveRun(seed: number, t: number, path: number[]): void {
  try {
    localStorage.setItem(`gr-best-${seed}`, String(t));
    localStorage.setItem(`gr-ghost-${seed}`, JSON.stringify(path));
  } catch {
    /* 무시 */
  }
}

export class GameScene extends Phaser.Scene {
  private seed = 0;
  private obstacles: Rect[] = [];
  private trail: number[] = []; // 플레이어 꼬리 [x0,y0,...]
  private px = 0;
  private py = 0;
  private heading = 0;
  private elapsed = 0;
  private phase: Phase = 'idle';

  // 고스트 녹화/재생
  private recPath: number[] = []; // 이번 주행 샘플 [x0,y0,...]
  private recAcc = 0;
  private ghost: number[] | null = null; // 베스트 런 경로

  private trackGfx!: Phaser.GameObjects.Graphics;
  private trailGfx!: Phaser.GameObjects.Graphics;
  private ghostGfx!: Phaser.GameObjects.Graphics;
  private ship!: Phaser.GameObjects.Triangle;
  private ghostShip!: Phaser.GameObjects.Triangle;
  private hud!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.seed = dailySeed();
    this.buildTrack(this.seed);

    this.trackGfx = this.add.graphics();
    this.ghostGfx = this.add.graphics(); // 트레일 아래에 깔리는 고스트 경로
    this.trailGfx = this.add.graphics();
    this.ghostShip = this.add
      .triangle(0, 0, 0, -7, -5, 6, 5, 6, 0x35d0ff)
      .setOrigin(0.5)
      .setAlpha(0.55)
      .setVisible(false);
    this.ship = this.add.triangle(0, 0, 0, -7, -5, 6, 5, 6, 0x39ff14).setOrigin(0.5);

    // HUD/오버레이는 화면 고정 (월드 스크롤과 무관).
    this.hud = this.add
      .text(8, 8, '', { fontFamily: 'monospace', fontSize: '14px', color: '#9be7ff' })
      .setScrollFactor(0)
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
      .setScrollFactor(0)
      .setDepth(20);

    // 카메라: 긴 월드를 따라 플레이어 추적. 플레이어를 화면 아래쪽에 두어 앞을 보여준다.
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.ship, true);
    this.cameras.main.setFollowOffset(0, -GAME_HEIGHT * 0.22);

    this.drawTrack();
    this.input.on('pointerdown', () => {
      if (this.phase === 'idle') this.startRun();
    });
    this.resetShip();
    this.showIdle('GHOST RACERS\n\n왼쪽 터치 = 좌회전\n오른쪽 터치 = 우회전\n\n탭해서 출발!');
  }

  // 일일 시드로 장애물을 긴 트랙 전체에 배치. 스타트/결승 구역은 비운다.
  private buildTrack(seed: number): void {
    const rng = mulberry32(seed);
    this.obstacles = [];
    const top = FINISH_Y + 90;
    const bottom = START_Y - 160;
    const count = Math.floor((bottom - top) / 260);
    for (let i = 0; i < count; i++) {
      const w = 50 + rng() * 90;
      const h = 24 + rng() * 60;
      const x = 30 + rng() * (GAME_WIDTH - 60 - w);
      const y = top + rng() * (bottom - top - h);
      this.obstacles.push({ x, y, w, h });
    }
  }

  private drawTrack(): void {
    const g = this.trackGfx;
    g.clear();
    g.lineStyle(3, 0x2a2a44, 1).strokeRect(4, 4, GAME_WIDTH - 8, WORLD_HEIGHT - 8);
    // 결승선: 체커무늬 밴드
    for (let x = 4, i = 0; x < GAME_WIDTH - 4; x += 16, i++) {
      g.fillStyle(i % 2 === 0 ? 0xffffff : 0x222230, 1);
      g.fillRect(x, FINISH_Y - 16, Math.min(16, GAME_WIDTH - 4 - x), 16);
    }
    // 100m 단위 거리 눈금 (전진감)
    g.lineStyle(1, 0x1c1c2c, 1);
    for (let y = START_Y - 200; y > FINISH_Y; y -= 200) {
      g.lineBetween(6, y, GAME_WIDTH - 6, y);
    }
    g.fillStyle(0x1b2a4a, 1).lineStyle(2, 0x3d5a9a, 1);
    for (const o of this.obstacles) {
      g.fillRect(o.x, o.y, o.w, o.h).strokeRect(o.x, o.y, o.w, o.h);
    }
  }

  private showIdle(message: string): void {
    this.phase = 'idle';
    this.overlay.setText(message).setVisible(true);
    const best = loadBest(this.seed);
    this.hud.setText(`SEED ${this.seed}\nBEST ${best ? best.toFixed(2) + 's' : '--'}`);
  }

  private resetShip(): void {
    this.px = GAME_WIDTH / 2;
    this.py = START_Y;
    this.heading = -Math.PI / 2; // 위쪽
    this.ship.setPosition(this.px, this.py).setRotation(0);
    this.cameras.main.setBackgroundColor('#0d0d12');
  }

  private startRun(): void {
    this.resetShip();
    this.trail.length = 0;
    this.recPath.length = 0;
    this.recAcc = 0;
    this.elapsed = 0;
    this.trailGfx.clear();

    // 이전 베스트 런을 고스트로 로드해 경로를 깔아준다.
    this.ghost = loadGhost(this.seed);
    this.ghostGfx.clear();
    if (this.ghost && this.ghost.length >= 4) {
      const gp = this.ghost;
      this.ghostGfx.lineStyle(2, 0x35d0ff, 0.35);
      this.ghostGfx.beginPath();
      this.ghostGfx.moveTo(gp[0], gp[1]);
      for (let i = 2; i < gp.length; i += 2) this.ghostGfx.lineTo(gp[i], gp[i + 1]);
      this.ghostGfx.strokePath();
      this.ghostShip.setPosition(gp[0], gp[1]).setVisible(true);
    } else {
      this.ghostShip.setVisible(false);
    }

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

    // 고스트 경로 녹화 (고정 간격 샘플 → 재생과 인덱스 정렬).
    this.recAcc += dt;
    while (this.recAcc >= REC_DT) {
      this.recPath.push(this.px, this.py);
      this.recAcc -= REC_DT;
    }

    // 플레이어 꼬리 트레일.
    this.trail.push(this.px, this.py);
    if (this.trail.length > TRAIL_MAX * 2) this.trail.splice(0, 2);
    this.drawTrail();

    this.updateGhost();

    this.ship.setPosition(this.px, this.py).setRotation(this.heading + Math.PI / 2);
    const progress = Math.max(0, Math.min(100, ((START_Y - this.py) / (START_Y - FINISH_Y)) * 100));
    this.hud.setText(`SEED ${this.seed}\nTIME ${this.elapsed.toFixed(1)}s   ${progress.toFixed(0)}%`);
  }

  // 녹화 간격 기준으로 고스트 위치 보간 재생.
  private updateGhost(): void {
    const g = this.ghost;
    if (!g || g.length < 4) return;
    const n = g.length / 2;
    const idx = this.elapsed / REC_DT;
    let i = Math.floor(idx);
    let gx: number;
    let gy: number;
    let gx2: number;
    let gy2: number;
    if (i >= n - 1) {
      i = n - 1;
      gx = gx2 = g[i * 2];
      gy = gy2 = g[i * 2 + 1];
    } else {
      const f = idx - i;
      gx = g[i * 2] + (g[i * 2 + 2] - g[i * 2]) * f;
      gy = g[i * 2 + 1] + (g[i * 2 + 3] - g[i * 2 + 1]) * f;
      gx2 = g[i * 2 + 2];
      gy2 = g[i * 2 + 3];
    }
    const rot = Math.atan2(gy2 - gy, gx2 - gx) + Math.PI / 2;
    this.ghostShip.setPosition(gx, gy).setRotation(rot);
  }

  private hitWall(): boolean {
    return this.px < 6 || this.px > GAME_WIDTH - 6 || this.py > WORLD_HEIGHT - 6;
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
      this.recPath.push(this.px, this.py); // 결승점까지 기록
      saveRun(this.seed, t, this.recPath);
      msg += prev ? `\nNEW BEST! (이전 ${prev.toFixed(2)}s)` : '\nNEW BEST!';
    } else {
      msg += `\nBEST ${prev.toFixed(2)}s`;
    }
    this.ghostShip.setVisible(false);
    this.cameras.main.flash(200, 57, 255, 20);
    this.showIdle(`${msg}\n\n탭해서 재도전`);
  }

  private wipe(): void {
    this.phase = 'dead';
    this.ghostShip.setVisible(false);
    this.cameras.main.setBackgroundColor('#3a0d14');
    this.cameras.main.shake(150, 0.01);
    this.time.delayedCall(450, () => {
      this.resetShip();
      this.showIdle(`CRASH!  ${this.elapsed.toFixed(2)}s\n\n탭해서 재시작`);
    });
  }
}
