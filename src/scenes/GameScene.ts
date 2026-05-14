import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// GHOST RACERS — 일일 시드 트랙 고스트 레이싱 프로토타입
// 코어 루프: 매일 같은 시드의 굽은 트랙을 달림. 함께 달리는 "고스트"는 (프로토타입에선)
//           시드로 결정되는 결정론적 레이서. 벽에 닿으면 와이프 → 재시작.
//           중앙선에 붙어 깔끔하게 달릴수록 빨라짐 = 타임이 곧 실력. 결승선에서 랭크 산출.
// 비동기 멀티플레이(라이브 서버 없음). 그래픽은 전부 플레이스홀더.

const TRACK_LEN = 7200; // 트랙 총 길이(월드 단위)
const CORRIDOR_HW = 70; // 코리도 반폭
const MIN_SPEED = 150;
const MAX_SPEED = 320;
const PLAYER_SCREEN_Y = GAME_HEIGHT * 0.72;
const GHOST_COUNT = 6;

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Wave {
  amp: number;
  freq: number;
  phase: number;
}

interface Ghost {
  speed: number;
  waves: Wave[];
  color: number;
  dot: Phaser.GameObjects.Rectangle;
  scroll: number;
  finishTime: number;
}

interface TrailPoint {
  x: number;
  scroll: number;
}

export class GameScene extends Phaser.Scene {
  private centerWaves: Wave[] = [];
  private ghosts: Ghost[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private playerDot!: Phaser.GameObjects.Rectangle;
  private playerX = GAME_WIDTH / 2;
  private playerScroll = 0;
  private elapsed = 0;
  private over = false;
  private trail: TrailPoint[] = [];
  private hud!: Phaser.GameObjects.Text;
  private seedLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  private daySeed(): number {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  create(): void {
    const seed = this.daySeed();
    const rng = mulberry32(seed);

    this.ghosts = [];
    this.trail = [];
    this.playerX = GAME_WIDTH / 2;
    this.playerScroll = 0;
    this.elapsed = 0;
    this.over = false;

    // 중앙선 곡선 (시드 결정론적)
    this.centerWaves = [];
    for (let i = 0; i < 4; i++) {
      this.centerWaves.push({
        amp: rng() * 55 + 18,
        freq: (rng() * 0.5 + 0.15) / 260,
        phase: rng() * Math.PI * 2,
      });
    }

    // 고스트 (시드 결정론적 결정론적 레이서)
    const palette = [0x6ea8ff, 0xff6ec7, 0xffd166, 0x8cffb0, 0xc792ff, 0xff9f6e];
    for (let i = 0; i < GHOST_COUNT; i++) {
      const waves: Wave[] = [];
      for (let w = 0; w < 2; w++) {
        waves.push({
          amp: rng() * (CORRIDOR_HW * 0.55),
          freq: (rng() * 0.6 + 0.2) / 220,
          phase: rng() * Math.PI * 2,
        });
      }
      const speed = MIN_SPEED + 40 + rng() * (MAX_SPEED - MIN_SPEED - 70);
      this.ghosts.push({
        speed,
        waves,
        color: palette[i % palette.length],
        dot: this.add.rectangle(0, -50, 12, 12, palette[i % palette.length]).setDepth(4),
        scroll: 0,
        finishTime: TRACK_LEN / speed,
      });
    }

    this.gfx = this.add.graphics().setDepth(1);
    this.playerDot = this.add.rectangle(this.playerX, PLAYER_SCREEN_Y, 14, 14, 0x4ed1a1).setDepth(6);

    this.hud = this.add
      .text(8, 8, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffffff' })
      .setDepth(10);
    this.seedLabel = this.add
      .text(GAME_WIDTH - 8, 8, `SEED ${seed}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#7a7a96',
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '화면을 눌러 좌우로 조향 — 중앙선에 붙을수록 빠름', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9a9ab0',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private centerX(scroll: number): number {
    let x = GAME_WIDTH / 2;
    for (const w of this.centerWaves) x += Math.sin(scroll * w.freq + w.phase) * w.amp;
    return Phaser.Math.Clamp(x, 118, GAME_WIDTH - 118);
  }

  private ghostX(g: Ghost): number {
    let x = this.centerX(g.scroll);
    for (const w of g.waves) x += Math.sin(g.scroll * w.freq + w.phase) * w.amp;
    return x;
  }

  update(_time: number, delta: number): void {
    if (this.over) return;
    const dt = Math.min(delta / 1000, 0.05);
    this.elapsed += dt;

    // 조향: 포인터를 누르면 그 X로 부드럽게 이동
    const p = this.input.activePointer;
    if (p.isDown) {
      this.playerX = Phaser.Math.Linear(this.playerX, p.worldX, Math.min(1, dt * 7));
    }

    // 중앙선 근접도 → 속도 (깔끔한 라인 = 빠름)
    const cx = this.centerX(this.playerScroll);
    const offset = Math.abs(this.playerX - cx);
    const proximity = Phaser.Math.Clamp(1 - offset / CORRIDOR_HW, 0, 1);
    const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * proximity;
    this.playerScroll += speed * dt;

    // 벽 충돌 → 와이프
    if (offset > CORRIDOR_HW) {
      this.wipe();
      return;
    }

    // 결승선
    if (this.playerScroll >= TRACK_LEN) {
      this.finish();
      return;
    }

    // 고스트 전진
    for (const g of this.ghosts) g.scroll = g.speed * this.elapsed;

    // 트레일 기록
    this.trail.push({ x: this.playerX, scroll: this.playerScroll });
    if (this.trail.length > 60) this.trail.shift();

    this.render(speed);
  }

  private worldToScreenY(scroll: number): number {
    return PLAYER_SCREEN_Y - (scroll - this.playerScroll);
  }

  private render(speed: number): void {
    const g = this.gfx;
    g.clear();

    // 코리도 벽
    g.lineStyle(3, 0x3a3a55, 1);
    const stepPx = 14;
    let leftStarted = false;
    let rightStarted = false;
    g.beginPath();
    for (let sy = -20; sy <= GAME_HEIGHT + 20; sy += stepPx) {
      const scroll = this.playerScroll + (PLAYER_SCREEN_Y - sy);
      if (scroll < 0 || scroll > TRACK_LEN) continue;
      const lx = this.centerX(scroll) - CORRIDOR_HW;
      if (!leftStarted) {
        g.moveTo(lx, sy);
        leftStarted = true;
      } else g.lineTo(lx, sy);
    }
    g.strokePath();
    g.beginPath();
    for (let sy = -20; sy <= GAME_HEIGHT + 20; sy += stepPx) {
      const scroll = this.playerScroll + (PLAYER_SCREEN_Y - sy);
      if (scroll < 0 || scroll > TRACK_LEN) continue;
      const rx = this.centerX(scroll) + CORRIDOR_HW;
      if (!rightStarted) {
        g.moveTo(rx, sy);
        rightStarted = true;
      } else g.lineTo(rx, sy);
    }
    g.strokePath();

    // 결승선
    if (TRACK_LEN <= this.playerScroll + GAME_HEIGHT) {
      const fy = this.worldToScreenY(TRACK_LEN);
      g.lineStyle(4, 0xffffff, 1);
      g.lineBetween(this.centerX(TRACK_LEN) - CORRIDOR_HW, fy, this.centerX(TRACK_LEN) + CORRIDOR_HW, fy);
    }

    // 플레이어 트레일
    g.lineStyle(3, 0x4ed1a1, 0.5);
    g.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const tp = this.trail[i];
      const sy = this.worldToScreenY(tp.scroll);
      if (i === 0) g.moveTo(tp.x, sy);
      else g.lineTo(tp.x, sy);
    }
    g.strokePath();

    // 고스트 + 고스트 점
    for (const gh of this.ghosts) {
      const sy = this.worldToScreenY(gh.scroll);
      const gx = this.ghostX(gh);
      gh.dot.setPosition(gx, sy);
      gh.dot.setVisible(sy > -30 && sy < GAME_HEIGHT + 30);
    }

    this.playerDot.setPosition(this.playerX, PLAYER_SCREEN_Y);

    const ahead = this.ghosts.filter((gh) => gh.scroll > this.playerScroll).length;
    const pct = Math.floor((this.playerScroll / TRACK_LEN) * 100);
    this.hud.setText(
      `진행 ${pct}%   속도 ${Math.round(speed)}   ⏱ ${this.elapsed.toFixed(1)}s   앞선 고스트 ${ahead}/${GHOST_COUNT}`,
    );
  }

  private wipe(): void {
    this.over = true;
    this.gfx.clear();
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setDepth(30);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '벽에 부딪힘 — WIPE\n\n탭하면 재시작', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ff6e6e',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.input.once('pointerdown', () => this.scene.restart());
  }

  private finish(): void {
    this.over = true;
    const myTime = this.elapsed;
    const beaten = this.ghosts.filter((g) => g.finishTime > myTime).length;
    const rank = GHOST_COUNT + 1 - beaten;
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setDepth(30);
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        `결승선 통과!\n\n타임: ${myTime.toFixed(2)}s\n랭크: ${rank} / ${GHOST_COUNT + 1}\n(고스트 ${beaten}명 추월)\n\n탭하면 재시작`,
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffd166',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(31);
    this.input.once('pointerdown', () => this.scene.restart());
  }
}
