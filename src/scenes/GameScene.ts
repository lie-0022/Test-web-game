import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// MOB BOSS — 군중(swarm) 지휘 아레나 + PvE 보스 프로토타입
// 코어 루프: 1마리로 시작 → 자유 생명체를 밟아 군중 모집 → 더 큰 군중이 작은 군중 흡수
//           → 주기적 보스(PvE) 등장, 누구나 때릴 수 있고 처치 시 자유 생명체 방출.
//           큰 군중은 약간 느림. 더 큰 봇 군중에 흡수당하면 게임오버.
// 최소 프로토타입 = 싱글 + 봇 군중(라이브 서버 없음). 그래픽은 플레이스홀더 도형.

const ARENA_TOP = 64;
const BOT_SWARMS = 3;
const FREE_TARGET = 40;
const BASE_SPEED = 140;
const BOSS_INTERVAL = 18;
const BOSS_MAX_HP = 90;
const MAX_DOTS = 40;

interface Swarm {
  x: number;
  y: number;
  size: number;
  isBot: boolean;
  color: number;
  dots: Phaser.GameObjects.Rectangle[];
  alive: boolean;
  tx: number;
  ty: number;
}

interface Boss {
  rect: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  hp: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Swarm;
  private bots: Swarm[] = [];
  private free: Phaser.GameObjects.Rectangle[] = [];
  private boss: Boss | null = null;
  private bossTimer = BOSS_INTERVAL;
  private freeSpawnTimer = 0;
  private elapsed = 0;
  private maxSize = 1;
  private over = false;
  private hud!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.bots = [];
    this.free = [];
    this.boss = null;
    this.bossTimer = BOSS_INTERVAL;
    this.freeSpawnTimer = 0;
    this.elapsed = 0;
    this.maxSize = 1;
    this.over = false;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14141c);
    this.add
      .rectangle(GAME_WIDTH / 2, (ARENA_TOP + GAME_HEIGHT) / 2, GAME_WIDTH - 6, GAME_HEIGHT - ARENA_TOP - 6)
      .setStrokeStyle(2, 0x33334a);

    this.player = this.makeSwarm(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, 1, 0x4ed1a1, false);
    const botColors = [0xd14e6e, 0x6e8cd1, 0xd1b14e];
    for (let i = 0; i < BOT_SWARMS; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(ARENA_TOP + 50, GAME_HEIGHT - 50);
      this.bots.push(this.makeSwarm(x, y, Phaser.Math.Between(2, 5), botColors[i], true));
    }

    for (let i = 0; i < FREE_TARGET; i++) this.spawnFree();

    this.hud = this.add
      .text(8, 8, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffffff' })
      .setDepth(20);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 22, '화면을 눌러 군중을 이끈다 — 보스를 같이 때려 생명체를 방출', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9a9ab0',
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private makeSwarm(x: number, y: number, size: number, color: number, isBot: boolean): Swarm {
    const dots: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < MAX_DOTS; i++) {
      dots.push(this.add.rectangle(x, y, 6, 6, color).setDepth(5).setVisible(false));
    }
    return { x, y, size, isBot, color, dots, alive: true, tx: x, ty: y };
  }

  private spawnFree(): void {
    const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
    const y = Phaser.Math.Between(ARENA_TOP + 20, GAME_HEIGHT - 30);
    this.releaseFreeAt(x, y);
  }

  private releaseFreeAt(x: number, y: number): void {
    this.free.push(this.add.rectangle(x, y, 7, 7, 0x8a8aa6).setDepth(3));
  }

  private radiusOf(s: Swarm): number {
    return 9 + Math.sqrt(s.size) * 4.2;
  }

  private speedOf(s: Swarm): number {
    return BASE_SPEED / (1 + s.size * 0.004);
  }

  update(_time: number, delta: number): void {
    if (this.over) return;
    const dt = Math.min(delta / 1000, 0.05);
    this.elapsed += dt;

    // 플레이어: 포인터를 누르면 목표 갱신
    const p = this.input.activePointer;
    if (p.isDown) {
      this.player.tx = Phaser.Math.Clamp(p.worldX, 12, GAME_WIDTH - 12);
      this.player.ty = Phaser.Math.Clamp(p.worldY, ARENA_TOP + 12, GAME_HEIGHT - 12);
    }
    this.stepSwarm(this.player, dt);

    // 봇: 가장 가까운 자유 생명체로, 없으면 배회
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      const near = this.nearestFree(bot.x, bot.y);
      if (near) {
        bot.tx = near.x;
        bot.ty = near.y;
      } else if (Phaser.Math.Distance.Between(bot.x, bot.y, bot.tx, bot.ty) < 8) {
        bot.tx = Phaser.Math.Between(40, GAME_WIDTH - 40);
        bot.ty = Phaser.Math.Between(ARENA_TOP + 40, GAME_HEIGHT - 40);
      }
      this.stepSwarm(bot, dt);
    }

    this.handleRecruit();
    this.handleSwarmCollisions();
    if (this.over) return;
    this.handleBoss(dt);

    // 자유 생명체 보충
    this.freeSpawnTimer -= dt;
    if (this.freeSpawnTimer <= 0 && this.free.length < FREE_TARGET) {
      this.spawnFree();
      this.freeSpawnTimer = 1.1;
    }

    this.renderSwarm(this.player);
    for (const bot of this.bots) this.renderSwarm(bot);

    this.maxSize = Math.max(this.maxSize, this.player.size);
    const aliveBots = this.bots.filter((b) => b.alive).length;
    this.hud.setText(
      `내 군중 ${this.player.size}   최대 ${this.maxSize}   라이벌 ${aliveBots}   다음 보스 ${Math.ceil(this.bossTimer)}s`,
    );
  }

  private stepSwarm(s: Swarm, dt: number): void {
    const dx = s.tx - s.x;
    const dy = s.ty - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const step = Math.min(this.speedOf(s) * dt, dist);
    s.x += (dx / dist) * step;
    s.y += (dy / dist) * step;
  }

  private nearestFree(x: number, y: number): Phaser.GameObjects.Rectangle | null {
    let best: Phaser.GameObjects.Rectangle | null = null;
    let bestD = Infinity;
    for (const f of this.free) {
      const d = Phaser.Math.Distance.Squared(x, y, f.x, f.y);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return best;
  }

  private handleRecruit(): void {
    const swarms = [this.player, ...this.bots].filter((s) => s.alive);
    for (let i = this.free.length - 1; i >= 0; i--) {
      const f = this.free[i];
      for (const s of swarms) {
        if (Phaser.Math.Distance.Between(f.x, f.y, s.x, s.y) < this.radiusOf(s) + 6) {
          s.size++;
          f.destroy();
          this.free.splice(i, 1);
          break;
        }
      }
    }
  }

  private handleSwarmCollisions(): void {
    const swarms = [this.player, ...this.bots];
    for (let i = 0; i < swarms.length; i++) {
      for (let j = i + 1; j < swarms.length; j++) {
        const a = swarms[i];
        const b = swarms[j];
        if (!a.alive || !b.alive) continue;
        const reach = this.radiusOf(a) + this.radiusOf(b);
        if (Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) > reach * 0.6) continue;
        if (a.size === b.size) continue;
        const bigger = a.size > b.size ? a : b;
        const smaller = bigger === a ? b : a;
        bigger.size += smaller.size;
        smaller.size = 0;
        smaller.alive = false;
        for (const d of smaller.dots) d.setVisible(false);
        if (smaller === this.player) {
          this.gameOver();
          return;
        }
      }
    }
  }

  private handleBoss(dt: number): void {
    if (!this.boss) {
      this.bossTimer -= dt;
      if (this.bossTimer <= 0) this.spawnBoss();
      return;
    }
    const b = this.boss;
    const swarms = [this.player, ...this.bots].filter((s) => s.alive);
    for (const s of swarms) {
      if (Phaser.Math.Distance.Between(s.x, s.y, b.rect.x, b.rect.y) < this.radiusOf(s) + 26) {
        b.hp -= s.size * dt * 1.6;
      }
    }
    b.hpBar.width = Math.max(0, (b.hp / BOSS_MAX_HP) * 80);
    b.hpBar.setPosition(b.rect.x - 40, b.rect.y - 36);
    if (b.hp <= 0) {
      for (let i = 0; i < 26; i++) {
        this.releaseFreeAt(
          b.rect.x + Phaser.Math.Between(-50, 50),
          Phaser.Math.Clamp(b.rect.y + Phaser.Math.Between(-50, 50), ARENA_TOP + 10, GAME_HEIGHT - 20),
        );
      }
      b.rect.destroy();
      b.hpBar.destroy();
      this.boss = null;
      this.bossTimer = BOSS_INTERVAL;
    }
  }

  private spawnBoss(): void {
    const x = Phaser.Math.Between(80, GAME_WIDTH - 80);
    const y = Phaser.Math.Between(ARENA_TOP + 80, GAME_HEIGHT - 120);
    const rect = this.add.rectangle(x, y, 44, 44, 0xff5050).setDepth(4).setStrokeStyle(2, 0xffffff);
    const hpBar = this.add.rectangle(x - 40, y - 36, 80, 6, 0xff5050).setOrigin(0, 0.5).setDepth(4);
    this.boss = { rect, hpBar, hp: BOSS_MAX_HP };
  }

  private renderSwarm(s: Swarm): void {
    const shown = Math.min(s.size, MAX_DOTS);
    const r = this.radiusOf(s);
    for (let i = 0; i < MAX_DOTS; i++) {
      const dot = s.dots[i];
      if (i >= shown) {
        dot.setVisible(false);
        continue;
      }
      const ang = (i / shown) * Math.PI * 2 + this.elapsed * 1.5;
      const rr = i === 0 ? 0 : r * (0.35 + ((i * 37) % 100) / 150);
      dot.setVisible(true);
      dot.setPosition(s.x + Math.cos(ang) * rr, s.y + Math.sin(ang) * rr);
    }
  }

  private gameOver(): void {
    this.over = true;
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.74)
      .setDepth(30);
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        `더 큰 군중에 흡수됨\n\n최대 군중 크기: ${this.maxSize}\n생존 ${this.elapsed.toFixed(1)}s\n\n탭하면 재시작`,
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ff6e6e',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(31);
    this.input.once('pointerdown', () => this.scene.restart());
  }
}
