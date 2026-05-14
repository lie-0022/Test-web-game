import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ARENA SMITHS — 실시간 배틀 + 무기 파츠 포징 프로토타입
// 코어 루프: 회전하는 칼날로 봇을 처치 → 봇이 무기 파츠를 떨굼 → 파츠를 주워 무기 강화
//           (길이/속도/데미지 변화) → 더 강한 빌드로 더 많이 처치. 봇 접촉 데미지로 사망.
// 최소 프로토타입 = 싱글 + 봇(라이브 서버 없음). 포지 UI 대신 즉시 장착식 파츠.
// 그래픽은 전부 플레이스홀더 도형.

const ARENA_TOP = 64;
const PLAYER_SPEED = 155;
const MAX_BOTS = 5;
const BOT_RESPAWN = 1.6;

interface Weapon {
  length: number;
  swingSpeed: number; // rad/s
  damage: number; // dps
  color: number;
}

interface Bot {
  rect: Phaser.GameObjects.Rectangle;
  hp: number;
  maxHp: number;
  speed: number;
}

interface PartDef {
  key: string;
  label: string;
  color: number;
  apply: (w: Weapon) => void;
}

interface PartPickup {
  rect: Phaser.GameObjects.Rectangle;
  def: PartDef;
}

const PARTS: PartDef[] = [
  { key: 'LONG', label: '긴 칼날', color: 0x6ea8ff, apply: (w) => (w.length = Math.min(92, w.length + 11)) },
  { key: 'FAST', label: '빠른 손잡이', color: 0xffd166, apply: (w) => (w.swingSpeed = Math.min(9, w.swingSpeed + 1.2)) },
  { key: 'SHARP', label: '날카로운 보석', color: 0xff6ec7, apply: (w) => (w.damage += 15) },
  {
    key: 'HEAVY',
    label: '무거운 코어',
    color: 0xff9f6e,
    apply: (w) => {
      w.damage += 28;
      w.swingSpeed = Math.max(1.3, w.swingSpeed - 0.9);
    },
  },
];

export class GameScene extends Phaser.Scene {
  private px = GAME_WIDTH / 2;
  private py = GAME_HEIGHT * 0.7;
  private hp = 100;
  private kills = 0;
  private weapon!: Weapon;
  private bladeAngle = 0;
  private bots: Bot[] = [];
  private parts: PartPickup[] = [];
  private respawnTimer = 0;
  private elapsed = 0;
  private over = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private playerRect!: Phaser.GameObjects.Rectangle;
  private hud!: Phaser.GameObjects.Text;
  private buildLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.px = GAME_WIDTH / 2;
    this.py = GAME_HEIGHT * 0.7;
    this.hp = 100;
    this.kills = 0;
    this.bladeAngle = 0;
    this.bots = [];
    this.parts = [];
    this.respawnTimer = 0;
    this.elapsed = 0;
    this.over = false;
    this.weapon = { length: 38, swingSpeed: 3, damage: 26, color: 0x8cffb0 };

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14141c);
    this.add
      .rectangle(GAME_WIDTH / 2, (ARENA_TOP + GAME_HEIGHT) / 2, GAME_WIDTH - 6, GAME_HEIGHT - ARENA_TOP - 6)
      .setStrokeStyle(2, 0x33334a);

    this.gfx = this.add.graphics().setDepth(4);
    this.playerRect = this.add.rectangle(this.px, this.py, 18, 18, 0x4ed1a1).setDepth(5);

    for (let i = 0; i < MAX_BOTS; i++) this.spawnBot();

    this.hud = this.add
      .text(8, 8, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffffff' })
      .setDepth(20);
    this.buildLabel = this.add
      .text(8, 28, '', { fontFamily: 'monospace', fontSize: '13px', color: '#8cffb0' })
      .setDepth(20);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 22, '화면을 눌러 이동 — 칼날은 자동 회전. 파츠를 주워 무기를 포징', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9a9ab0',
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private spawnBot(): void {
    let x = 0;
    let y = 0;
    // 플레이어와 너무 가깝지 않게
    for (let tries = 0; tries < 10; tries++) {
      x = Phaser.Math.Between(30, GAME_WIDTH - 30);
      y = Phaser.Math.Between(ARENA_TOP + 30, GAME_HEIGHT - 40);
      if (Phaser.Math.Distance.Between(x, y, this.px, this.py) > 110) break;
    }
    const maxHp = 38;
    const rect = this.add.rectangle(x, y, 16, 16, 0xd14e6e).setDepth(5);
    this.bots.push({ rect, hp: maxHp, maxHp, speed: Phaser.Math.Between(64, 96) });
  }

  private dropPart(x: number, y: number): void {
    const def = Phaser.Utils.Array.GetRandom(PARTS);
    const rect = this.add.rectangle(x, y, 11, 11, def.color).setDepth(3).setStrokeStyle(1, 0xffffff);
    this.parts.push({ rect, def });
  }

  update(_time: number, delta: number): void {
    if (this.over) return;
    const dt = Math.min(delta / 1000, 0.05);
    this.elapsed += dt;

    // 이동
    const p = this.input.activePointer;
    if (p.isDown) {
      const dx = p.worldX - this.px;
      const dy = p.worldY - this.py;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        const step = Math.min(PLAYER_SPEED * dt, dist);
        this.px = Phaser.Math.Clamp(this.px + (dx / dist) * step, 12, GAME_WIDTH - 12);
        this.py = Phaser.Math.Clamp(this.py + (dy / dist) * step, ARENA_TOP + 12, GAME_HEIGHT - 12);
      }
    }
    this.playerRect.setPosition(this.px, this.py);

    // 칼날 자동 회전
    this.bladeAngle += this.weapon.swingSpeed * dt;
    const tipX = this.px + Math.cos(this.bladeAngle) * this.weapon.length;
    const tipY = this.py + Math.sin(this.bladeAngle) * this.weapon.length;

    // 봇 이동 + 칼날 데미지 + 접촉 데미지
    for (const bot of this.bots) {
      const bx = bot.rect.x;
      const by = bot.rect.y;
      const d = Phaser.Math.Distance.Between(bx, by, this.px, this.py);
      if (d > 1) {
        const step = bot.speed * dt;
        bot.rect.x += ((this.px - bx) / d) * step;
        bot.rect.y += ((this.py - by) / d) * step;
      }
      // 칼날(선분) 충돌 → 지속 데미지
      if (this.pointToSegment(bx, by, this.px, this.py, tipX, tipY) < 12) {
        bot.hp -= this.weapon.damage * dt;
      }
      // 접촉 데미지
      if (d < 18) {
        this.hp -= 17 * dt;
      }
    }

    // 죽은 봇 처리
    for (let i = this.bots.length - 1; i >= 0; i--) {
      if (this.bots[i].hp <= 0) {
        const bot = this.bots[i];
        this.dropPart(bot.rect.x, bot.rect.y);
        bot.rect.destroy();
        this.bots.splice(i, 1);
        this.kills++;
      }
    }

    // 봇 리스폰
    if (this.bots.length < MAX_BOTS) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.spawnBot();
        this.respawnTimer = BOT_RESPAWN;
      }
    }

    // 파츠 줍기
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const part = this.parts[i];
      if (Phaser.Math.Distance.Between(part.rect.x, part.rect.y, this.px, this.py) < 16) {
        part.def.apply(this.weapon);
        this.weapon.color = part.def.color;
        this.flashPickup(part.def.label);
        part.rect.destroy();
        this.parts.splice(i, 1);
      }
    }

    if (this.hp <= 0) {
      this.gameOver();
      return;
    }

    this.drawBlade(tipX, tipY);
    this.hud.setText(`HP ${Math.ceil(this.hp)}   처치 ${this.kills}   ⏱ ${this.elapsed.toFixed(1)}s`);
    this.buildLabel.setText(
      `무기 — 길이 ${Math.round(this.weapon.length)}  속도 ${this.weapon.swingSpeed.toFixed(1)}  데미지 ${Math.round(this.weapon.damage)}`,
    );
  }

  private drawBlade(tipX: number, tipY: number): void {
    const g = this.gfx;
    g.clear();
    g.lineStyle(4, this.weapon.color, 1);
    g.lineBetween(this.px, this.py, tipX, tipY);
    g.fillStyle(this.weapon.color, 1);
    g.fillCircle(tipX, tipY, 4);
    // 봇 HP 바
    for (const bot of this.bots) {
      const w = (bot.hp / bot.maxHp) * 18;
      g.fillStyle(0xff5050, 1);
      g.fillRect(bot.rect.x - 9, bot.rect.y - 14, Math.max(0, w), 3);
    }
  }

  private pointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const abx = bx - ax;
    const aby = by - ay;
    const lenSq = abx * abx + aby * aby || 1;
    let t = ((px - ax) * abx + (py - ay) * aby) / lenSq;
    t = Phaser.Math.Clamp(t, 0, 1);
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    return Math.hypot(px - cx, py - cy);
  }

  private flashPickup(label: string): void {
    const txt = this.add
      .text(this.px, this.py - 26, label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(25);
    this.tweens.add({
      targets: txt,
      y: txt.y - 26,
      alpha: 0,
      duration: 700,
      onComplete: () => txt.destroy(),
    });
  }

  private gameOver(): void {
    this.over = true;
    this.gfx.clear();
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.76)
      .setDepth(30);
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        `쓰러짐\n\n처치: ${this.kills}\n생존: ${this.elapsed.toFixed(1)}s\n최종 무기 — 길이 ${Math.round(
          this.weapon.length,
        )} / 속도 ${this.weapon.swingSpeed.toFixed(1)} / 데미지 ${Math.round(this.weapon.damage)}\n\n탭하면 재시작`,
        {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: '#ff6e6e',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(31);
    this.input.once('pointerdown', () => this.scene.restart());
  }
}
