import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// PIXEL SNATCH — 루팅 아레나 + cash-out 프로토타입
// 코어 루프: 코인 수집 → 많이 들수록 느려짐 → 도둑끼리 부딪히면 더 많이 든 쪽이 흘림
//           → 출구(아래 노란 띠)에서 cash-out → 점수 확정. 60초 라운드.
// 봇 페이크 멀티플레이(서버 없음). 그래픽은 전부 플레이스홀더 도형.

const ROUND_TIME = 60;
const COIN_TARGET = 26;
const BOT_COUNT = 4;
const PLAYER_SPEED = 185;
const BOT_SPEED = 130;
const ARENA_TOP = 70;
const EXIT_H = 64;
const ARENA_BOTTOM = GAME_HEIGHT - EXIT_H;

interface Thief {
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  loot: number;
  isBot: boolean;
  bumpCooldown: number;
  drainTimer: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Thief;
  private bots: Thief[] = [];
  private coins: Phaser.GameObjects.Rectangle[] = [];
  private zone!: Phaser.GameObjects.Arc;
  private zoneRadius = 0;
  private banked = 0;
  private timeLeft = ROUND_TIME;
  private over = false;
  private hud!: Phaser.GameObjects.Text;
  private coinSpawnTimer = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.bots = [];
    this.coins = [];
    this.banked = 0;
    this.timeLeft = ROUND_TIME;
    this.over = false;
    this.coinSpawnTimer = 0;

    // 아레나 배경
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14141c);
    this.add
      .rectangle(GAME_WIDTH / 2, (ARENA_TOP + ARENA_BOTTOM) / 2, GAME_WIDTH - 8, ARENA_BOTTOM - ARENA_TOP, 0x1d1d2a)
      .setStrokeStyle(2, 0x33334a);

    // 출구(cash-out) 띠
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - EXIT_H / 2, GAME_WIDTH, EXIT_H, 0x3a3415);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - EXIT_H / 2, '▼ CASH OUT ▼', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffe066',
      })
      .setOrigin(0.5);

    // 줄어드는 안전 구역
    this.zoneRadius = GAME_WIDTH * 0.62;
    this.zone = this.add.circle(GAME_WIDTH / 2, (ARENA_TOP + ARENA_BOTTOM) / 2, this.zoneRadius);
    this.zone.setStrokeStyle(2, 0x4ed1a1, 0.6);

    // 코인
    for (let i = 0; i < COIN_TARGET; i++) this.spawnCoin();

    // 플레이어
    this.player = this.makeThief(GAME_WIDTH / 2, ARENA_BOTTOM - 60, 0x4ed1a1, false);
    // 봇
    for (let i = 0; i < BOT_COUNT; i++) {
      const bx = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const by = Phaser.Math.Between(ARENA_TOP + 40, ARENA_BOTTOM - 40);
      this.bots.push(this.makeThief(bx, by, 0xd14e6e, true));
    }

    // HUD
    this.hud = this.add
      .text(8, 8, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffffff' })
      .setDepth(10);

    // 라운드 타이머
    this.time.addEvent({
      delay: 1000,
      repeat: ROUND_TIME - 1,
      callback: () => {
        this.timeLeft--;
        if (this.timeLeft <= 0) this.endRound();
      },
    });
  }

  private makeThief(x: number, y: number, color: number, isBot: boolean): Thief {
    const rect = this.add.rectangle(x, y, 18, 18, color).setDepth(5);
    const label = this.add
      .text(x, y - 16, '0', { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(6);
    return { rect, label, loot: 0, isBot, bumpCooldown: 0, drainTimer: 0 };
  }

  private spawnCoin(): void {
    const x = Phaser.Math.Between(24, GAME_WIDTH - 24);
    const y = Phaser.Math.Between(ARENA_TOP + 24, ARENA_BOTTOM - 24);
    this.dropCoinAt(x, y);
  }

  private dropCoinAt(x: number, y: number): void {
    const coin = this.add.rectangle(x, y, 8, 8, 0xffe066).setDepth(2);
    this.coins.push(coin);
  }

  private speedFor(t: Thief, base: number): number {
    return base / (1 + t.loot * 0.018);
  }

  update(_time: number, delta: number): void {
    if (this.over) return;
    const dt = delta / 1000;

    // 플레이어 이동: 포인터를 누르고 있으면 그쪽으로
    const p = this.input.activePointer;
    if (p.isDown) {
      this.moveToward(this.player, p.worldX, p.worldY, this.speedFor(this.player, PLAYER_SPEED) * dt);
    }

    // 봇 이동: 가장 가까운 코인으로
    for (const bot of this.bots) {
      const target = this.nearestCoin(bot.rect.x, bot.rect.y);
      if (target) {
        this.moveToward(bot, target.x, target.y, this.speedFor(bot, BOT_SPEED) * dt);
      }
    }

    this.collectCoins();
    this.handleBumps(dt);
    this.shrinkZone(dt);
    this.handleZoneDrain(dt);
    this.handleCashOut();

    // 코인 보충
    this.coinSpawnTimer -= dt;
    if (this.coinSpawnTimer <= 0 && this.coins.length < COIN_TARGET) {
      this.spawnCoin();
      this.coinSpawnTimer = 0.7;
    }

    // 라벨 따라다니기
    this.syncLabel(this.player);
    for (const bot of this.bots) this.syncLabel(bot);

    this.hud.setText(
      `들고있음: ${this.player.loot}   은행: ${this.banked}   ⏱ ${this.timeLeft}s`,
    );
  }

  private moveToward(t: Thief, tx: number, ty: number, step: number): void {
    const dx = tx - t.rect.x;
    const dy = ty - t.rect.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const nx = t.rect.x + (dx / dist) * Math.min(step, dist);
    const ny = t.rect.y + (dy / dist) * Math.min(step, dist);
    t.rect.x = Phaser.Math.Clamp(nx, 12, GAME_WIDTH - 12);
    t.rect.y = Phaser.Math.Clamp(ny, ARENA_TOP + 12, ARENA_BOTTOM - 12);
  }

  private nearestCoin(x: number, y: number): Phaser.GameObjects.Rectangle | null {
    let best: Phaser.GameObjects.Rectangle | null = null;
    let bestD = Infinity;
    for (const c of this.coins) {
      const d = Phaser.Math.Distance.Squared(x, y, c.x, c.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  private collectCoins(): void {
    const all: Thief[] = [this.player, ...this.bots];
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      for (const t of all) {
        if (Phaser.Math.Distance.Between(c.x, c.y, t.rect.x, t.rect.y) < 16) {
          t.loot++;
          c.destroy();
          this.coins.splice(i, 1);
          break;
        }
      }
    }
  }

  private handleBumps(dt: number): void {
    const all: Thief[] = [this.player, ...this.bots];
    for (const t of all) t.bumpCooldown = Math.max(0, t.bumpCooldown - dt);

    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        if (Phaser.Math.Distance.Between(a.rect.x, a.rect.y, b.rect.x, b.rect.y) > 20) continue;
        // 더 많이 든 쪽이 흘린다
        const rich = a.loot >= b.loot ? a : b;
        if (rich.loot > 0 && rich.bumpCooldown <= 0) {
          const spill = Math.max(1, Math.floor(rich.loot * 0.3));
          rich.loot -= spill;
          rich.bumpCooldown = 0.6;
          for (let k = 0; k < spill; k++) {
            this.dropCoinAt(
              rich.rect.x + Phaser.Math.Between(-22, 22),
              rich.rect.y + Phaser.Math.Between(-22, 22),
            );
          }
        }
      }
    }
  }

  private shrinkZone(dt: number): void {
    this.zoneRadius = Math.max(90, this.zoneRadius - 8 * dt);
    this.zone.setRadius(this.zoneRadius);
  }

  private handleZoneDrain(dt: number): void {
    const all: Thief[] = [this.player, ...this.bots];
    for (const t of all) {
      const outside =
        Phaser.Math.Distance.Between(t.rect.x, t.rect.y, this.zone.x, this.zone.y) >
        this.zoneRadius;
      if (outside && t.loot > 0) {
        t.drainTimer += dt;
        if (t.drainTimer >= 0.7) {
          t.drainTimer = 0;
          t.loot--;
          this.dropCoinAt(t.rect.x, t.rect.y);
        }
      } else {
        t.drainTimer = 0;
      }
    }
  }

  private handleCashOut(): void {
    const all: Thief[] = [this.player, ...this.bots];
    for (const t of all) {
      if (t.rect.y > ARENA_BOTTOM - 4 && t.loot > 0) {
        if (!t.isBot) {
          this.banked += t.loot;
          this.flashCashOut(t.loot);
        }
        t.loot = 0;
      }
    }
  }

  private flashCashOut(amount: number): void {
    const txt = this.add
      .text(this.player.rect.x, this.player.rect.y - 28, `+${amount}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffe066',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => txt.destroy(),
    });
  }

  private syncLabel(t: Thief): void {
    t.label.setPosition(t.rect.x, t.rect.y - 16);
    t.label.setText(String(t.loot));
  }

  private endRound(): void {
    if (this.over) return;
    this.over = true;
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setDepth(30);
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        `라운드 종료\n\n은행에 넣은 점수: ${this.banked}\n(들고만 있던 ${this.player.loot}은 날아감)\n\n탭하면 재시작`,
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffffff',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(31);
    this.input.once('pointerdown', () => this.scene.restart());
  }
}
