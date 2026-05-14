# .io 픽셀 웹게임 — 시장 리서치 + 콘셉 옵션

## 개요 / 목표

**Test-web-game**의 다음 단계는 "어떤 게임을 만들지" 결정하는 것이다. 목적은 **최대한 많은
유저가 모이는 게임**을 만드는 것.

쓰레드/포럼/업계 분석 기반 리서치(시장 장르 · 웹게임 실현가능성 · 비주얼·바이럴 · 콘셉 설계)를
거쳐 방향을 확정했다:

- **장르:** .io 멀티플레이 (agar.io / slither.io / diep.io 계보)
- **비주얼:** 픽셀 아트 / 레트로
- **유통:** 웹게임 포털 중심 — Poki(월 1억 명), CrazyGames(월 3천만 명). 포털은 그래픽이 아니라
  **코어 루프와 "feel"**을 본다.
- **기술 스택:** 2D + Phaser 3 + TypeScript + Vite (확정, [`mobile-web-game-research.md`](mobile-web-game-research.md) 참조)

이 문서는 **콘셉을 1개로 확정하지 않는다.** 4개 후보를 비교 정리해 이후 결정의 근거로 삼는다.

---

## 1. .io 시장 현황 (2024–2025)

- **.io는 여전히 유효하지만 순수 PvP는 포화됐다.** 2014–2018년식 순수 PvP(agar.io, slither.io)는
  솔로로 뚫기 어렵다. 2025년에 성공하는 .io는 **트위스트**가 있다 — dress-up .io(전투 대신 경쟁적
  창작), PvE 리더보드, RPG 진행 하이브리드, 스킬 기반 변형.
- **포털이 메인 유통 채널.** 2025년 Poki에서만 1,018개 게임이 100만 플레이를 넘겼다 — .io 구조는
  여전히 대규모 도달이 가능. 포털 요구사항:
  - 빠른 로드 (초기 다운로드 Poki 기준 <8MB)
  - 모바일 최적화 (터치, 세로/가로 대응)
  - PEGI-12 수준 콘텐츠, 내부 광고·외부 브랜딩 금지
  - 심사는 코어 루프와 UX/feel 중심
- **2025 .io 진화 방향:** dress-up .io, PvE 변형(순수 PvP 대신 협동/PvE 리더보드),
  RPG 진행 하이브리드(코스메틱·배틀패스), 모바일 퍼스트 컨트롤.
- **솔로 현실 스코프:** 폴리시된 **진짜 실시간** .io는 ~16–20주 (멀티플레이 테스트·밸런싱·서버
  셋업 포함). 코드보다 **에셋 제작이 병목** — 픽셀 아트는 제작이 싸고 에셋 팩(Kenney, OpenGameArt)이
  많아 이 병목을 크게 줄인다.
- **바이럴 = 클립성:** 틱톡/쇼츠가 발견 경로. 의외의 실패 순간, "내 점수 겨봐" 공유, 리더보드.

출처: [Top .io Games Q1 2025 — Sensor Tower](https://sensortower.com/blog/2025-q1-unified-top-5-io%20games-units-us-643088c5e1714cfff1a6c7c5),
[.io Games 2025 Status — OreateAI](https://www.oreateai.com/blog/best-io-games-2025/),
[Poki: 1B Monthly Plays](https://techfundingnews.com/browser-gaming-website-poki-won-big-at-the-dutch-game-awards-celebrating-hitting-1-billion-monthly-plays/),
[CrazyGames Documentation](https://docs.crazygames.com/),
[Poki Developer Requirements](https://sdk.poki.com/requirements.html)

---

## 2. 멀티플레이 백엔드 현실 — 핵심 의사결정 포인트

.io 게임에서 가장 큰 의사결정은 "백엔드를 어떻게 할 것인가"다. 이것이 스코프·비용·리스크를 좌우한다.

### 2.1 백엔드 옵션 비교

| 옵션 | 설명 | 스택 적합도 | 서버 권위형? | 솔로 평가 |
|---|---|---|---|---|
| **Socket.IO + Node** | WebSocket 위의 얇은 프레임워크. 룸 루프·상태 동기화·보간·매치메이킹을 직접 구현 | TS 네이티브 | 직접 구현하면 가능 | 제어권 최대, 보일러플레이트 최대 |
| **Colyseus** | TS/Node 멀티플레이 프레임워크. 룸·스키마 기반 델타 상태 동기화·매치메이킹 내장 | **TS 네이티브 — 최적** | **설계상 서버 권위형** | **진짜 멀티플레이 최선택.** 넷코드 직접 구현 최소화 |
| **Nakama** | Go 기반 풀 백엔드. 실시간 + 채팅 + 리더보드 + 매치메이킹 + 계정 | Go 서버 | 가능 | 강력하나 무겁다. 단일 .io 타이틀엔 과함 |
| **Photon** | 상용 실시간 SaaS 릴레이/룸 | SDK 기반 | 릴레이/룸 기반, 권위 로직은 직접 | 독점, CCU 과금. Unity 쪽에 흔하고 Phaser/TS엔 덜 자연스러움 |
| **Poki netlib** | WebRTC P2P 데이터채널 라이브러리. Poki가 시그널링 + STUN/TURN 무료 호스팅 | TS 친화 | **아니오 — P2P, 권위 서버·안티치트 없음** | 서버비 0. 친구 초대 로비엔 좋고, 공개 무신뢰 .io엔 부적합 |
| **CrazyGames SDK** | 넷코드 백엔드 아님. 초대 링크/룸 파라미터(`inviteLink`, `getInviteParam`) 제공 | SDK 브릿지 | 해당 없음 — 로비/초대 레이어 | 어떤 백엔드 위에든 얹는 글루. 백엔드 대체 아님 |

**요약:** 이 스택의 현실적 후보는 **Colyseus**(진짜 서버 권위형) 또는 **Socket.IO**(직접 구현
권위형), 가벼운 P2P엔 **Poki netlib**, 가장 낮은 리스크엔 **백엔드 없음(봇)**. Nakama·Photon은
솔로 Phaser/TS 단일 타이틀엔 적합도가 낮다.

### 2.2 클라이언트 권위형 vs 서버 권위형

- **클라이언트 권위형** (클라가 자기 위치/점수를 보고): 구현은 쉽지만, 모르는 사람끼리 매칭되는
  공개 .io에선 **치팅이 너무 쉽다** — 스피드핵, 텔레포트, 가짜 점수. 비공개/친구 전용이거나
  "멀티플레이"가 실제로는 봇일 때만 허용 가능.
- **서버 권위형** (서버가 월드 상태 소유, 클라는 입력만 전송, 서버가 스냅샷 브로드캐스트, 클라는
  보간/예측): 진짜 공개 .io의 올바른 모델. 비용 — 서버 루프, 상태 스키마, 클라 보간, 랙 보상.
  Colyseus는 이 보일러플레이트의 ~60%를 제거, Socket.IO는 ~0% 제거.
- **현실적 절충:** 서버 권위형이되 *단순하게* — 낮은 틱레이트(10–15Hz), 작은 룸(20–40명),
  롤백 없음, 스냅샷 보간만. 대부분의 성공한 소규모 .io가 실제로 이렇게 돈다.

### 2.3 호스팅 비용/복잡도

| 방식 | 비용 | 운영 부담 |
|---|---|---|
| 봇 / 백엔드 없음 | $0 | 0 — 게임과 같은 CDN에서 정적 서빙 |
| Poki netlib (P2P) | ≈$0 | 거의 0 — Poki가 시그널링+TURN 무료 호스팅 |
| Colyseus 자체 호스팅 | $5–12/월 (1–2GB VPS) | 박스 관리·배포·재시작·스케일링 직접 |
| Colyseus Cloud (매니지드) | ~$15/월부터 | 운영 부담 제거, 플랜 티어로 스케일 |
| Photon | 무료 티어 있음(CCU 제한) | CCU 과금 — 게임이 뜨면 비쌀 수 있음 |

**최소 실행 가능 진짜 멀티플레이:** Colyseus + 싼 VPS 1대(또는 Colyseus Cloud 입문 티어),
10–15Hz 틱, 룸 크기 제한. 월 $5–15, 트래픽이 검증될 때까지 수동 스케일링 감수.

### 2.4 백엔드 회피 전략 (중요)

**봇으로 멀티플레이를 페이크하는 것은 포털 업계 표준**이며 정당한 전략이다:

- 플래그십이 아닌 .io 게임 다수는 진짜 온라인이 아니다 — 사람 같은 닉네임과 다양한 스킬 티어
  (보통 / 느린 반응 / AFK / "OP" 빠른 반응)의 봇으로 붐비는 아레나를 시뮬레이션한다.
- **Paper.io 2, Hole.io**가 널리 알려진 봇 기반 "페이크 멀티플레이" 사례.
- 솔로 이점: **서버비 0, 넷코드 0, 매치메이킹 0, 즉시 로드, 오프라인 동작, 치팅 없음, 그리고
  빈 로비 문제 없음** — 빈 로비는 소규모 *진짜* .io 게임의 1순위 사인(死因)이다.
- **비동기 멀티플레이**는 제3의 길: 라이브 연결 없이 진짜 플레이어 데이터 사용 — 고스트 리플레이,
  비동기 리더보드, "내 런 vs 다른 플레이어 런 스냅샷", 일일 챌린지 시드. 소셜하게 느껴지면서도
  stateless HTTP API + DB(혹은 포털 리더보드 API)만 필요.

**판단 기준:** 도달을 최적화하는 솔로 개발자에겐 *봇 페이크 또는 비동기가 디폴트*여야 하고,
진짜 실시간은 의도적으로 스코프업한 선택이어야 한다 — 가정된 필수 요구사항이 아니라.

출처: [Colyseus pricing](https://colyseus.io/pricing/) · [Colyseus Cloud](https://colyseus.io/cloud-managed-hosting/),
[Nakama vs Colyseus — Heroic Labs](https://forum.heroiclabs.com/t/nakama-vs-colyseus/1632),
[Game Server Showdown 2025 — medevel.com](https://medevel.com/game-server-2025/),
[Poki netlib — GitHub](https://github.com/poki/netlib),
[CrazyGames HTML5 v2 SDK](https://docs.crazygames.com/sdk/html5-v2/intro/),
[Creating a Fake Multiplayer Experience in Paper.IO 2 — Tiny Warrior Games](https://tinywarriorgames.com/2019/12/20/creating-a-fake-multiplayer-experience-in-paper-io-2/)

---

## 3. 콘셉 후보 4개

저위험 → 고천장 순서. 메커닉이 서로 명확히 다른 4개.

### Concept 1 — PIXEL SNATCH (저위험, 봇 페이크, 빠른 출시)

- **핏치:** 작은 픽셀 도둑이 되어, 금고 타이머가 줄어들기 전에 봇들과 보물을 쓸어 담는 레트로
  루팅 아레나 .io.
- **코어 루프 (30초):** 탑다운 픽셀 금고에 입장. 탭/드래그로 이동. 코인·보석 수집 → 많이 들수록
  약간 느려지고 *떨어뜨리기 쉬워짐* → 더 큰 도둑과 부딪히면 보물을 흘림. "경보" 타이머가 안전
  구역을 줄임. 출구에서 cash-out 하거나 보물을 잃음. 점수 = 은행에 넣은 보물. 2초 만에 재시작.
- **트위스트:** 익스트랙션 게임의 risk/reward "cash-out" 메커닉. 긴장은 "커져라"가 아니라 "지금
  은행에 넣을까, 보석 하나 더 노릴까". 대부분의 .io는 점수를 *확정*시키지 못하지만 이 게임은 한다 —
  막판 결정 순간이 클립거리가 됨.
- **픽셀 적합성:** 작은 스프라이트, 큼직한 코인, 단순 타일 금고 — Kenney/OpenGameArt 팩이 ~90% 커버.
  애니메이션 무거운 캐릭터 불필요.
- **바이럴 훅:** "0.3초 남기고 9,400 입금" 스크린샷, "출구에서 다 잃음" 실패 클립. 점수 공유 내장.
- **솔로 스코프:** 4개 중 가장 쉬움. **~6–9주.** 가장 어려운 부분: 욕심 많고 당황하는 인간처럼
  *느껴지는* 봇 AI. 가장 쉬운 부분: 넷코드·서버 없음.
- **백엔드:** 없음. 봇 페이크. 선택적으로 포털 SDK 또는 작은 HTTP 엔드포인트로 비동기 리더보드.
- **비교 게임:** Paper.io 2(봇 모델), Hole.io(수집 루프), 익스트랙션 게임의 긴장(단순화).

### Concept 2 — GHOST RACERS (저위험, 비동기 멀티플레이) ★ 추천 1순위

- **핏치:** 일일 시드 트랙에서 진짜 플레이어들의 베스트 런 *고스트*와 경쟁하는 레트로 트레일 레이싱 .io.
- **코어 루프 (30초):** 매일 절차적으로 생성되는 네온 트랙. slither.io식 라이트 트레일을 남기지만
  목표는 *먹기*가 아니라 *속도 + 깔끔한 라인*. 화면에 함께: 오늘 시드를 달린 진짜 플레이어들의
  리플레이 고스트 트레일 5–10개. 벽이나 고스트의 단단한 트레일에 부딪히면 와이프. 결승선 = 랭킹
  타임. 내일은 새 시드.
- **트위스트:** 라이브 레이스처럼 보이고 느껴지지만 비동기다 — 모든 "상대"가 진짜 녹화된 런이라,
  라이브 서버·빈 로비·랙 없이 소셜하고 경쟁적이다. 일일 시드가 습관 루프와 공통 화젯거리를 만든다.
- **픽셀 적합성:** 검은 배경 위 네온 레트로. 트레일은 라인 + 글로우, 트랙은 타일 기반. 캐릭터 아트
  거의 불필요.
- **바이럴 훅:** 일일 리더보드("오늘 5만 명 중 340위"), 공유 가능한 고스트 리플레이 클립, 아슬한
  추월. 일일 시드 자체가 소셜 콘텐츠.
- **솔로 스코프:** 저~중. **~8–11주.** 가장 어려운 부분: 결정론적 리플레이 시스템 + 런 녹화/저장.
  가장 쉬운 부분: 실시간 넷코드 없음, 단순 stateless API.
- **백엔드:** 비동기만 — 런 제출/조회용 stateless HTTP API + 작은 DB(또는 리플레이 blob용 오브젝트
  스토리지). 저렴, 라이브 서버 루프 없음.
- **비교 게임:** slither.io(트레일 메커닉), Trackmania(고스트/일일 시드 문화), Wordle(일일 시드 습관 루프).

### Concept 3 — MOB BOSS (중위험, 실시간, RPG 진행 하이브리드)

- **핏치:** 외로운 고블린 1마리로 시작해 *불어나는 군중(mob)*을 모집하는 실시간 픽셀 아레나 .io —
  "크기"가 곧 당신이 지휘하는 떼다.
- **코어 루프 (30초):** 픽셀 생명체 1마리로 스폰. 아레나에 자유 생명체·약한 몹이 돌아다님 → 밟고
  지나가면 모집(군중이 눈에 띄게 커짐). 큰 군중은 작은 플레이어를 덮치고 처치 시 *그 군중*을 흡수.
  단 클수록 측면이 뚫리기 쉽고 회전이 느림. 주기적 "보스 웨이브"(PvE)가 모두에게 다툴 거리를 줌.
  죽으면 군중을 모집 가능한 유닛으로 떨굼.
- **트위스트:** .io 트위스트 2개를 쌓음 — (1) 질량이 *조종 가능한 대형(formation)*이라 위치잡기/대형이
  스킬, (2) 공유 PvE 보스 웨이브가 약한 플레이어에게 머물 이유를 줌(agar.io 문제 = 작은 플레이어는
  그냥 먹힘 → 여기선 보스 farm 가능).
- **픽셀 적합성:** 4–8px 생명체 떼는 픽셀 아트의 *이상적* 활용 — 작고 읽히고 그리기 싸고, 큰 떼는
  저해상도에서 장관. 보스 = 큰 스프라이트 1개.
- **바이럴 훅:** "200마리 군중이 로비를 쓸어버림" 파워 판타지 클립, 드라마틱한 군중 대 군중 충돌,
  측면 뚫려서 녹는 순간.
- **솔로 스코프:** 중~고. **~14–18주.** 가장 어려운 부분: 스케일에서 서버 권위형 군중 동기화
  (플레이어당 다수 엔티티) + 밸런싱. 가장 쉬운 부분은 아트.
- **백엔드:** 실시간 서버 권위형 — **Colyseus**, 10–15Hz 틱, 룸당 ~20–30명 제한, 군중을 상태
  스키마에 압축 표현. *봇 패딩*으로 출시 후 트래픽이 늘면 진짜 플레이어로 교체 가능(하이브리드 디리스크).
- **비교 게임:** agar.io(질량 루프), diep.io(아레나 PvP), Vampire Survivors(군중/호드 미감).

### Concept 4 — ARENA SMITHS (고천장, 고위험, 코스메틱/소셜 깊이)

- **핏치:** 전투 사이사이 루팅한 파츠로 *자기 무기를 직접 포징·커스텀*하는 실시간 픽셀 배틀 .io —
  dress-up/크래프팅 .io.
- **코어 루프 (30초):** 서버 권위형 탑다운 아레나 난투. 다른 플레이어와 싸움 → 처치/목표가 무기
  *파츠*(칼날, 손잡이, 보석, 트레일 FX)를 떨굼. 매치 중 퀵 장착으로 무브가 바뀜. 라운드 사이
  포지 화면에서 실제 스탯/비주얼 트레이드오프를 가진 개인 무기를 조립·과시. 코스메틱 로드아웃 영속.
- **트위스트:** 검증된 "dress-up .io" 코스메틱 깊이 방향 + 실제 전투. 진행과 자기표현이 리텐션
  레이어, 난투가 엔진. 픽셀 무기 파츠는 수집·공유 가능.
- **픽셀 적합성:** 모듈식 픽셀 무기 파츠는 대량 제작이 쌈 — 흔한 에셋 병목이 오히려 *기능*이 됨
  (파츠가 많을수록 깊이가 깊고, 각 파츠는 작음). 레트로 아레나 타일셋도 풍부.
- **바이럴 훅:** "내 저주받은 무기 빌드 봐라" 공유, 코스메틱 플렉스, 만족스러운 원샷 킬 클립.
  코스메틱 깊이가 재방문을 유도.
- **솔로 스코프:** 가장 높음. **~16–20주+.** 가장 어려운 부분: 실시간 전투 넷코드 + 로드아웃
  영속성 레이어 + 파츠 콘텐츠 트레드밀. 가장 쉬운 부분: 점진적 — 파츠 적게 출시 후 추가 가능.
- **백엔드:** 실시간 서버 권위형(Colyseus) **+** 로드아웃용 영속성/계정 레이어(Colyseus + DB,
  또는 계정/리더보드/스토리지 번들이 필요하면 Nakama — 4개 콘셉 중 Nakama의 추가 기능이 값을
  하는 유일한 경우).
- **비교 게임:** diep.io(아레나 전투), "dress-up .io" 트렌드(코스메틱 깊이), Brawl Stars(로드아웃/난투 루프).

---

## 4. 추천 랭킹

**최대 도달 / 솔로 / 픽셀** 기준 랭킹:

### 1순위 — GHOST RACERS (추천 메인)

리스크/리워드 최선. 비동기 모델이 솔로 .io의 최대 사인(빈 실시간 로비 + 넷코드/스케일 비용)을
회피하면서도 멀티플레이처럼 *느껴지고* 경쟁적이다. 일일 시드 루프는 검증된 리텐션/바이럴 엔진
(Wordle, Trackmania)이고 포털이 좋아한다. 픽셀/레트로 네온은 제작이 싸고 차별적으로 보인다.
백엔드는 stateless API — 저렴, 라이브 서버 없음, 안티치트 악몽 없음. 현실적 솔로 기간에 출시
가능하고 폴리시 천장이 높다.

### 2순위 — PIXEL SNATCH (추천 빠른/안전 폴백)

가장 빠른 출시, 전체적으로 가장 낮은 리스크(백엔드 0). cash-out 메커닉이 "제일 커져라" 이상의
진짜 훅을 준다. *뭔가*를 빨리 포털에 올려 퍼블리싱 파이프라인을 학습하는 게 우선이라면 이상적.
Ghost Racers보다 천장이 약간 낮음(순수 봇 게임은 알려진 리텐션 한계가 있음)지만 가장 안전한 베팅.

### 3순위 — MOB BOSS (진짜 멀티플레이를 원하면)

가장 강한 *진짜* 실시간 콘셉이자 바이럴 천장이 가장 높음(군중 클립은 금광). PvE 보스 트위스트가
"작은 플레이어가 먹히고 떠난다"는 결함을 직접 해결. 하지만 Colyseus, 서버 운영, 엔티티 동기화
밸런싱에 커밋해야 함 — 리스크와 기간이 한 단계 상승. 봇 패딩 출시 경로가 의미 있게 디리스크함.
"진짜 멀티플레이"가 절대 요구사항이면 이걸 선택.

### 4순위 — ARENA SMITHS (최고 천장, 최고 리스크 — 첫 작품으론 비추천)

가장 풍부한 리텐션 디자인이자 장기적으로 가장 방어 가능하지만, 실시간 넷코드 + 영속성 + 콘텐츠
트레드밀 세 가지 어려운 문제를 솔로가 동시에 떠안음. "버전 2"로 다루거나, 더 단순한 타이틀 하나로
퍼블리싱 파이프라인을 검증하고 스택 경험을 쌓은 뒤 재방문하는 게 최선.

### 핵심 메시지

도달이 명시적 목표인 솔로 개발자라면 **Ghost Racers**로 시작(또는 첫 출시 속도가 천장보다
중요하면 **Pixel Snatch**). 진짜 실시간 멀티플레이(Mob Boss / Arena Smiths)는 두 번째 프로젝트를
위한 의도적 스코프업으로 다루고, 디폴트 가정으로 삼지 말 것 — "폴리시된 실시간 .io는 16–20주"
추정은 현실이며, 그 리스크 대부분은 비동기/봇 방식으로 사라진다.

---

## 5. 출처

**.io 시장 / 포털**
- [Top .io Games Q1 2025 — Sensor Tower](https://sensortower.com/blog/2025-q1-unified-top-5-io%20games-units-us-643088c5e1714cfff1a6c7c5)
- [.io Games 2025 Status — OreateAI](https://www.oreateai.com/blog/best-io-games-2025/)
- [Poki: 1B Monthly Plays](https://techfundingnews.com/browser-gaming-website-poki-won-big-at-the-dutch-game-awards-celebrating-hitting-1-billion-monthly-plays/)
- [CrazyGames Documentation](https://docs.crazygames.com/)
- [Poki Developer Requirements](https://sdk.poki.com/requirements.html)
- [Navigating Web Gaming Platforms for Indie Developers — hology.app](https://hology.app/blog/web-gaming-1)

**멀티플레이 백엔드 / 기술**
- [Colyseus pricing](https://colyseus.io/pricing/) · [Colyseus Cloud](https://colyseus.io/cloud-managed-hosting/)
- [Nakama vs Colyseus — Heroic Labs forum](https://forum.heroiclabs.com/t/nakama-vs-colyseus/1632)
- [Nakama VS Colyseus — SaaSHub](https://www.saashub.com/compare-nakama-vs-colyseus)
- [Game Server Showdown 2025 — medevel.com](https://medevel.com/game-server-2025/)
- [Making Multiplayer Games with Colyseus, Node.js and TypeScript — GitNation](https://gitnation.com/contents/making-multiplayer-games-with-colyseus-nodejs-and-typescript)
- [Poki netlib (Poki Networking Library) — GitHub](https://github.com/poki/netlib)
- [CrazyGames Developer Portal](https://developer.crazygames.com/) · [CrazyGames HTML5 v2 SDK](https://docs.crazygames.com/sdk/html5-v2/intro/)
- [Creating a Fake Multiplayer Experience in Paper.IO 2 — Tiny Warrior Games](https://tinywarriorgames.com/2019/12/20/creating-a-fake-multiplayer-experience-in-paper-io-2/)
- [Are .io games online? — Quora](https://www.quora.com/Are-io-games-online)
- [Mobile Gaming: The Fake Multiplayer Epidemic — LinkedIn](https://www.linkedin.com/pulse/mobile-gaming-fake-multiplayer-epidemic-jonathan-jungck)

**시장 / 바이럴 / 비주얼 (배경)**
- [State of Mobile Gaming 2025 — Sensor Tower](https://sensortower.com/blog/state-of-mobile-gaming-2025)
- [The State of Mobile Gaming 2025 — Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2025/6/5/the-state-of-mobile-gaming-2025)
- [Top 7 Art Styles Dominating Mobile Games in 2025 — Zvky](https://www.zvky.com/blogs/articles/top-7-art-styles-dominating-mobile-games-in-2025)
- [Retro Game Boom 2025 — TechTimes](https://www.techtimes.com/articles/313127/20251203/retro-game-boom-2025-why-pixel-art-games-indie-gaming-trends-are-popular-again.htm)
- [Viral Gameplay in 2026 — TechTimes](https://www.techtimes.com/articles/313453/20251218/viral-gameplay-2026-why-live-gaming-clips-dominate-youtube-shorts-tiktok-feeds.htm)
- [Mobile Gaming Benchmarks 2025 — Gamigion](https://www.gamigion.com/mobile-gaming-benchmarks-2025/)
- [Essential Scope Rules for Solo Game Dev — Wayline](https://www.wayline.io/blog/essential-scope-rules-solo-game-dev)

---

## 다음 단계 (이후 세션)

- 콘셉 1개 최종 확정
- 게임 디자인 문서(GDD) 작성
- 프로젝트 스캐폴딩 (Vite + Phaser 3 + TS) 및 프로토타입 구현
