# Test-web-game

모바일 브라우저에서 실행되는 **모바일 웹게임** 프로젝트.

> **🌿 이 브랜치: `concept/pixel-snatch` — PIXEL SNATCH 프로토타입**
> 루팅 아레나 + cash-out, 봇 페이크 멀티플레이. 코어 루프만 구현된 최소 프로토타입.
> 테스트: `npm install && npm run dev` → 화면을 누르고 드래그해 코인 수집, 아래 노란 띠에서 cash-out.
> 구현: [`src/scenes/GameScene.ts`](src/scenes/GameScene.ts)

현재 단계: 기술 스택 리서치 완료, 공통 스캐폴딩 완료, 콘셉 프로토타입 단계.
방향 확정 — **2D + TypeScript + .io + 픽셀/레트로**.

## 권장 스택

| 영역 | 권장 | 근거 |
|---|---|---|
| 프레임워크 | **Phaser 3** | 풀 프레임워크 — Scale Manager, Mobile Pipeline(3.60+), 물리/씬/입력/오디오 내장. 2D 모바일 웹게임 커뮤니티 1순위 |
| 대안 | PixiJS | 번들 ~3배 작고 렌더링 ~2배 빠름. 단, 렌더러뿐이라 엔진 레이어 직접 구축 필요 |
| 언어 | **TypeScript** | Phaser가 1급 타입 정의 제공, 빈약한 문서를 자동완성이 보완, 유지보수 유리 |
| 빌드 도구 | **Vite** | 즉시 시작 + HMR, 설정 거의 불필요. 공식 `phaserjs/template-vite-ts` |
| 오디오 | Howler.js | 포맷 폴백 + iOS 오디오 언락 자동 처리, audio sprite |
| 에셋 | TexturePacker 아틀라스, WebP, WebM→MP3 폴백 | draw call / HTTP 요청 수 절감 |

## Quick-Start 체크리스트

1. **2D, Phaser 3, TypeScript** — 첫 모바일 웹게임은 3D 금지.
2. **모바일 우선 설정** — viewport meta, Scale Manager `FIT`, `touch-action: none`, 44px+ 터치 타깃, `devicePixelRatio` 캡.
3. **고정 저해상도 렌더** (≈640px 너비대) + 업스케일 — 폰에서 풀 레티나 렌더 금지.
4. **고정 타임스텝 게임 루프** — 프레임 레이트가 30fps로 스로틀될 수 있다고 가정, `visibilitychange`에 일시정지.
5. **텍스처 아틀라스** (TexturePacker) — 작은 스프라이트 다수, `tileSprite` 남용 금지, 비트맵 폰트 사용.
6. **오디오는 Howler.js** — WebM→MP3 폴백, audio sprite, 첫 터치에 언락.
7. **오브젝트 풀링** — 반복 생성되는 모든 것(총알/적/파티클), 프레임당 할당 0, Arcade 물리 + 원형 콜라이더.
8. **씬별 에셋 프리로드** + 로딩 바, 이후 레벨은 지연 로드. 세션 페이로드 ~3–5MB 유지.
9. **실제 저사양 안드로이드 + iOS Safari에서 조기 테스트**, 첫날부터 FPS 카운터.
10. **배포** — 정적 호스팅 + PWA 우선 설계, 이후 포털(CrazyGames/Poki) 라이선싱, 광고+하이브리드 수익 모델, 점수/IAP는 서버 검증.

## 실행 방법

```bash
npm install
npm run dev      # 로컬 dev 서버 (모바일 테스트 시 host 노출됨)
npm run build    # 타입체크 + 프로덕션 빌드
```

내부 해상도는 480×854 고정(세로형), Scale Manager `FIT` 으로 업스케일된다.
콘셉별 코어 루프는 `src/scenes/GameScene.ts` 한 파일에 들어간다.

## 콘셉 프로토타입 브랜치

`.io` + 픽셀/레트로 방향으로 4개 콘셉을 각 브랜치에서 최소 코어루프 프로토타입으로 구현했다.
콘셉 비교/근거는 [`docs/game-concept-research.md`](docs/game-concept-research.md) 참조.

| 브랜치 | 콘셉 | 한 줄 |
|---|---|---|
| `concept/pixel-snatch` | PIXEL SNATCH | 루팅 아레나 + cash-out, 봇 페이크 |
| `concept/ghost-racers` | GHOST RACERS | 일일 시드 트랙 고스트 레이싱, 비동기 |
| `concept/mob-boss` | MOB BOSS | 군중(swarm) 지휘 아레나 + PvE 보스 |
| `concept/arena-smiths` | ARENA SMITHS | 실시간 배틀 + 무기 파츠 포징 |

각 브랜치를 체크아웃 → `npm install && npm run dev` 로 개별 테스트.

## 상세 리서치

- 기술 스택: [`docs/mobile-web-game-research.md`](docs/mobile-web-game-research.md)
- 게임 콘셉: [`docs/game-concept-research.md`](docs/game-concept-research.md)

## 다음 단계 (이후 세션)

- 콘셉 4개 테스트 후 1개 최종 확정
- 확정 콘셉의 게임 디자인 문서(GDD) 작성 및 버티컬 슬라이스 구현
