# Test-web-game

모바일 브라우저에서 실행되는 **모바일 웹게임** 프로젝트.

현재 단계: 기술 스택 리서치 완료. 코드 스캐폴딩 전.
방향 확정 — **2D + TypeScript**.

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

## 상세 리서치

프레임워크 비교, 모바일 성능 함정, JS vs TS, 빌드 툴링, 에셋 관리, 2D vs 3D, 배포/수익화,
초보자 흔한 실수, 2023–2025 동향, 전체 출처 링크 → [`docs/mobile-web-game-research.md`](docs/mobile-web-game-research.md)

## 다음 단계 (이후 세션)

- Vite + Phaser 3 + TypeScript 프로젝트 스캐폴딩 (`phaserjs/template-vite-ts` 기반)
- `package.json`, `tsconfig.json`, `vite.config.ts` 설정
- 게임 로직 / 씬 / 에셋 구현
