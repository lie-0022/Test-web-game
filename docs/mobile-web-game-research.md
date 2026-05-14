# 모바일 웹게임 기술 스택 리서치

쓰레드/포럼/레딧 기반 조사 결과 정리. 커뮤니티 출처: Reddit(r/gamedev, r/html5gamedev, r/webdev),
HTML5GameDevs 포럼, Phaser Discourse, Hacker News, DEV, web.dev, Mozilla Hacks, 개발 블로그.

대상: **모바일 브라우저에서 실행되는 게임**(네이티브 앱 아님).

> 조사 한계: 다수 포럼/블로그가 직접 fetch 시 HTTP 403을 반환해, 상세 근거는 WebSearch 결과 요약과
> 접근 가능한 출처를 종합했다. 동일 쓰레드 URL은 그대로 인용했으니 브라우저에서 열람 가능하다.
> Reddit 자체 검색 인덱싱이 빈약해, 실질적 토론은 HTML5GameDevs 포럼 · Phaser Discourse ·
> Hacker News에서 더 많이 확인됐다(동일 개발자 커뮤니티).

---

## 1. 렌더링 / 게임 프레임워크 비교

커뮤니티는 프레임워크를 "풀 게임 프레임워크" vs "렌더링 라이브러리" vs "에디터 기반 엔진"으로 구분한다.
2D 모바일 웹게임의 지배적 추천은 **Phaser**이며, 최대 성능/최소 번들이 필요하고 엔진 레이어를 직접
구축할 의향이 있으면 **PixiJS**다.

### Phaser 3 (2D) — 기본 추천
- **장점:** *완성형* 프레임워크 — 물리(Arcade + Matter.js), 씬 관리, 입력, 오디오, 트윈, 에셋 로더,
  그리고 모바일에서 특히 중요한 **Scale Manager**(기기 리사이즈/풀스크린 처리) 내장. 초보 친화적,
  빠른 개발에 적합.
- **트레이드오프:** 번들이 큼(~1.2 MB vs PixiJS ~450 KB), 순수 렌더링 처리량은 PixiJS의 약 절반.
  문서가 빈약/번거롭다는 평이 많음 — 이것이 Phaser + TypeScript 조합을 미는 #1 이유(§3 참조).
  Phaser 3.60+ 는 모바일 성능 불만에 대응해 iOS/Android 자동 감지 **Mobile Pipeline**을 추가.
- 출처: [Phaser vs PixiJS for making 2D games — DEV](https://dev.to/ritza/phaser-vs-pixijs-for-making-2d-games-2j8c),
  [WebGL Libraries for 2D games: Pixi vs Phaser — fgfactory](https://fgfactory.com/webgl-libraries-for-2d-games),
  [Phaser 3.60 MobilePerformance changelog](https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/MobilePerformance.md),
  [PixiJS or Phaser? — HTML5GameDevs](https://www.html5gamedevs.com/topic/46899-question-pixiejs-or-phaserio/)

### PixiJS (2D 렌더링 라이브러리)
- **장점:** Phaser보다 ~3배 작고 순수 렌더링은 ~2배 빠름. 모바일/소셜·인스턴트 게임/웹뷰 임베드에서
  번들 크기가 *결정적*이라는 의견이 반복됨 — 로드 시간과 FPS가 최우선이면 PixiJS가 유리.
- **트레이드오프:** *렌더러일 뿐.* 물리·씬·입력 추상화·오디오는 직접 조립하거나 라이브러리를 추가해야 함.
  작업량과 의사결정이 늘지만 상한이 높음.
- **합의:** "표준 2D 게임 → Phaser. 커스텀 인터랙티브 앱이거나 최대 성능 필요 → PixiJS."
- 출처: [Phaser vs PixiJS — DEV](https://dev.to/ritza/phaser-vs-pixijs-for-making-2d-games-2j8c),
  [JS GameDev Ecosystem overview — DEV](https://dev.to/arnaudmorisset/an-overview-of-the-javascript-gamedev-ecosystem-4afb),
  [js-game-rendering-benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)

### Three.js vs Babylon.js (3D)
- **Three.js:** ~168 KB gzipped — 훨씬 가볍고 구조가 단순, GPU 메모리/셰이더를 세밀하게 제어 가능
  (모바일 제약에 맞춰 직접 튜닝하기 좋음). 초보자·소규모·모바일에 권장.
- **Babylon.js:** 풀 번들 ~1.4 MB(모듈식이라 트리셰이킹 가능). "배터리 포함"형, 대규모/복잡 프로젝트에
  견고하고 기본 비주얼 품질이 높지만 무겁다.
- **모바일 참고:** 둘 다 모바일 최적화를 표방하진 않음. 모바일 타깃 3D는 커뮤니티가 **PlayCanvas**를 지목
  ("기본적으로 모바일 성능 최적화").
- 출처: [Three.js vs Babylon.js — LogRocket](https://blog.logrocket.com/three-js-vs-babylon-js/),
  [Three.js vs Babylon.js vs PlayCanvas — Utsubo](https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison),
  [BabylonJS vs ThreeJS performance — Babylon.js forum](https://forum.babylonjs.com/t/babylonjs-vs-threejs-performance-comparison/45704)

### 에디터 기반 엔진: PlayCanvas · Construct · Defold · Cocos
- **PlayCanvas:** 클라우드 기반 협업형 3D HTML5 엔진. 모바일/데스크톱 브라우저 + 네이티브 래핑.
  *전문 3D 웹게임*용 커뮤니티 추천이자 명시적으로 모바일 최적화. 3D 빌드 ~1–2 MB.
- **Defold:** 무료, 진정한 크로스플랫폼(웹·모바일·데스크톱·콘솔). **작고 빠르게 로드되는 빌드**로 호평
  ("2D는 Phaser와 Defold가 이기기 어렵다"). 나중에 네이티브 모바일/콘솔 익스포트도 원하면 유리.
- **Construct:** 이벤트 기반 비주얼 에디터, 노코드/로우코드 — 비프로그래머에게 가장 빠른 경로.
- **Cocos Creator:** 인스턴트 게임/하이퍼캐주얼 영역에 강한 또 다른 에디터 옵션.
- 일반 프레이밍: 에디터 엔진은 비주얼 툴링으로 개발 속도를 높이지만, 코드 우선 프레임워크(Phaser, PixiJS)는
  제어권이 크고 번들이 작고 예측 가능하다.
- 출처: [Defold vs PlayCanvas — Slant](https://www.slant.co/versus/1117/5149/~defold_vs_playcanvas),
  [Best JS/HTML5 game engines 2025 — LogRocket](https://blog.logrocket.com/best-javascript-html5-game-engines-2025/),
  [[Mobile Games] Unity vs Defold vs Godot — Defold forum](https://forum.defold.com/t/mobile-games-unity-vs-defold-vs-godot-which-engine/67042)

### Raw Canvas / 마이크로 라이브러리
초소형 게임·게임잼·학습용, 혹은 최소 footprint가 필요할 때 언급(Kontra, LittleJS, litecanvas 등).
비-트리비얼 프로젝트에는 커뮤니티가 권장하지 않음 — Phaser가 이미 주는 것을 전부 재구현해야 함.
출처: [js-game-rendering-benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)

**결론:** 2D 모바일 웹게임 → **Phaser**(성능/번들이 결정적이고 엔진 레이어를 직접 짤 거면 **PixiJS**).
3D → **Three.js**(가볍게, 직접 최적화) 또는 **PlayCanvas**(모바일 최적화 + 에디터).
네이티브 익스포트도 원하면 → **Defold**. 비프로그래머 → **Construct**.

---

## 2. 모바일 브라우저 성능 — 함정과 잘 되는 것

포럼 전반에서 가장 일관된 주제: **모바일이 HTML5 게임이 고전하는 지점**이고, 실패 패턴은 예측 가능하다.

### 흔한 함정
- **DOM이 느리다.** 모바일 HTML5 게임에서 가장 느린 두 부분은 브라우저의 DOM 처리와 일관성 없는
  하드웨어 가속. DOM이 커질수록 순회가 모든 것을 느리게 만든다. → DOM을 최소화하고 미사용 노드를
  분리, 게임 렌더링은 DOM 요소가 아니라 Canvas/WebGL로.
- **GC 스터터.** 프레임마다 객체를 생성/파괴하면 GC 끊김 발생. 보편적 해법: **오브젝트 풀링** —
  미리 할당하고 재사용(총알, 적, 파티클).
- **캔버스 크기 = fill rate 비용.** "캔버스가 클수록 다시 그릴 픽셀이 많다." 고정 저해상도로 렌더하고
  업스케일하면(예: 너비 캡, 640×480) FPS가 크게 오른다는 보고 다수. `devicePixelRatio` 주의 —
  풀 레티나 해상도 렌더링은 모바일 GPU를 죽인다.
- **에셋 부풀림 / 로드 시간.** 큰 텍스처·오디오·스프라이트시트가 로드 시간을 망친다. **세션 총
  페이로드 ~3–5 MB** 유지. iOS Safari는 과거 캐싱 제한이 공격적이라 큰 게임이 고통스러웠음.
  **WebP** 이미지, **Ogg/압축** 오디오, **스프라이트 시트 / 텍스처 아틀라스**로 HTTP 요청 절감.
- **iOS Safari 오디오.** 오래되고 여전히 인용되는 고통: Web Audio / `AudioContext`는 실제 사용자
  인터랙션(터치/클릭) 후에만 소리가 난다. 명시적인 tap-to-start 게이트를 둘 것.
- **입력 모델.** `click`/마우스 이벤트가 아니라 `touchstart`/`touchend`를 쓸 것 — 모바일에서 click은
  지연이 있고, 작은 입력 지연도 빠른 게임을 망친다.
- **물리 과용.** update 루프에서 충돌 검사를 프레임당 여러 번 호출, Arcade로 충분한데 무거운 물리
  (p2/Matter)를 사용. 물리는 단순하게.
- **시뮬레이터는 거짓말한다.** 반복되는 조언 — *실제 중·저사양 기기*에서 테스트할 것. 데스크톱과
  시뮬레이터는 터치 지연과 thermal throttling을 숨긴다.

### 잘 되는 것
오브젝트 풀링; 고정/저 렌더 해상도 + 업스케일(`devicePixelRatio` 유의); 스프라이트 아틀라스;
씬별 에셋 프리로드(및 다가올 에셋 사전 워밍, 예: 보스 텍스처); 객체 참조 캐싱; FPS 카운터로 추측 대신
측정; 프레임워크의 모바일 파이프라인 활용(Phaser 3.60+ 는 iOS/Android에서 자동 활성화).
한 Phaser 개발자의 2025년 글은 저해상도 캔버스 · 풀링 · 프레임당 할당 축소가 액션 게임을 폰에서
부드럽게 만든 핵심이라고 명시.

출처: [Optimizing HTML5 Action Games for Mobile — DEV](https://dev.to/gamh5games/optimizing-html5-action-games-for-mobile-devices-19ce),
[What to do when your HTML5 game runs slow on mobile — Game Developer](https://www.gamedeveloper.com/programming/what-to-do-when-your-html5-game-runs-slow-on-mobile-devices),
[Best practices of building mobile-friendly HTML5 games — Gamedev.js](https://gamedevjs.com/articles/best-practices-of-building-mobile-friendly-html5-games/),
[Disappointed with HTML5 perf on mobile — HTML5GameDevs](https://www.html5gamedevs.com/topic/23113-disappointed-with-general-html5-games-performance-on-mobile-devices/),
[How to improve performance on mobile — HTML5GameDevs](https://www.html5gamedevs.com/topic/14036-how-to-improve-performance-on-mobile/),
[How I optimized my Phaser 3 action game in 2025 — Phaser](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025),
[Fixing HTML5 Audio on iOS/Android — Code Theory](https://codetheory.in/fixing-html5-audio-problems-in-ios-and-android-mobile-browsers-to-overcome-the-limitations/),
[Tips on speeding up Phaser games — GitHub gist](https://gist.github.com/MarcL/748f29faecc6e3aa679a385bffbdf6fe)

---

## 3. JavaScript vs TypeScript — 커뮤니티 합의

**소규모/잼 게임을 넘어서는 거의 모든 경우 TypeScript 쪽으로 명확히 기운다** — 그 경향은 특히
Phaser 커뮤니티에서 가장 강하다.

- **Phaser 한정 결정적 논거:** Phaser 문서가 빈약하다고 평가되므로, TS의 자동완성/타입 정보가
  "문서를 들락거리는 횟수를 극적으로 줄여준다" — 함수가 어떤 인자를 어떤 순서로 받는지, 무엇을
  반환하는지, `Sprite`/`Scene`이 어떤 속성을 갖는지 바로 보인다. Phaser는 **1급 TypeScript 정의**를 제공.
- **일반 논거:** 타입 안정성, 자기 문서화 코드, 유지보수 용이, 규모가 커질 때 버그 감소, 오래된 코드로
  복귀하기 쉬움(순수 JS는 무엇이 선택/필수인지 알 수 없음).
- **JS가 괜찮은 경우:** 빠른 프로토타이핑, 짧은 개발 사이클, 소규모 팀/게임, 학습·교육 목적.
  빌드/트랜스파일 단계가 필요 없음.
- **성능:** 차별점 아님 — TS는 JS로 컴파일됨. 둘 다 "고성능"이며, 핫 패스에는 typed array buffer,
  정말 더 필요하면 WebAssembly를 언급.
- 출처: [TypeScript vs Pure JavaScript — HTML5GameDevs](https://www.html5gamedevs.com/topic/40709-typescript-vs-pure-javascript-code/),
  [JavaScript VS TypeScript — Phaser Discourse](https://phaser.discourse.group/t/javascript-vs-typescript/5872),
  [Easily Use TypeScript with Phaser 3 — Ourcade](https://blog.ourcade.co/posts/2020/phaser-3-typescript/),
  [6 months building a game with Phaser + TypeScript — Hacker News](https://news.ycombinator.com/item?id=16373214)

---

## 4. 빌드 툴링과 프로젝트 셋업

**거의 만장일치 추천: Vite.** 이 용도에서 Webpack을 사실상 대체했다.

- **이유:** 즉각적인 dev 서버 시작, 빠른 HMR(수동 새로고침 없이 변경 반영), 최적화된 프로덕션 빌드,
  "Phaser를 돌리는 데 복잡한 설정 파일이 거의 필요 없음" — "Rollup·Webpack보다 훨씬 빠르고 단순"하다는 평.
- **공식 템플릿(권장 시작점):** Phaser가 공식 템플릿 유지 — `phaserjs/template-vite`(JS),
  `phaserjs/template-vite-ts`(TypeScript). 핫 리로딩 + 동작하는 빌드 파이프라인을 바로 제공.
- **커뮤니티 템플릿:** Ourcade의 `phaser3-vite-template` / `phaser3-typescript-vite-template`,
  `ubershmekel/vite-phaser-ts-starter`(게임 메뉴 예제 포함).
- **에셋 처리:** Vite는 JS `import`로 에셋 로드 + 정적 폴더 서빙 둘 다 지원. 큰 게임 에셋은
  정적 폴더 로딩 사용.
- **모바일 웹게임 권장 셋업:** Vite + TypeScript + Phaser 공식 TS 템플릿 → `npm run dev`로 로컬 서버,
  표준 Vite 프로덕션 빌드로 배포.
- 출처: [Phaser + Vite Template — Phaser](https://phaser.io/news/2024/01/phaser-vite-template),
  [phaserjs/template-vite-ts — GitHub](https://github.com/phaserjs/template-vite-ts),
  [ourcade/phaser3-vite-template — GitHub](https://github.com/ourcade/phaser3-vite-template),
  [How to setup a Phaser 3 project with Vite — saricden](https://saricden.com/how-to-setup-a-phaser-3-project-with-vite)

---

## 5. 모바일 특화 고려사항

### 터치 입력
- `touchstart`/`touchend`를 듣고 `e.touches[0]`에서 좌표를 읽는다. **최소 44×44 px 터치 타깃**을
  보장, 기본 브라우저 터치 동작 제거(`touch-action: none`, 더블탭 줌·당겨서 새로고침 방지),
  탭-응답 **~50 ms 이하** 목표. 데스크톱 click 핸들러를 재사용하지 말 것.
- swipe/pinch는 **Hammer.js** 같은 제스처 라이브러리가 흔히 권장됨.
- 모바일 오디오는 첫 사용자 인터랙션 전까지 잠겨 있음 — 터치 이벤트 안에서 언락해야 함
  (Howler.js는 첫 `touchend`에 빈 버퍼를 재생해 자동 처리).

### 반응형 스케일링 / 뷰포트 / 종횡비
- 캔버스는 **고정 내부 픽셀 크기**를 갖고 CSS 크기로 표시된다. 베스트 프랙티스: CSS가 표시 크기를
  정하게 하고, 그 값을 읽어 캔버스 내부 해상도를 맞춘다.
- 종횡비 보존: 창이 타깃 비율보다 높/좁으면 너비 100% + 상하 레터박스, 넓/낮으면 높이 100% +
  좌우 레터박스. CSS `object-fit: contain`으로 구현 가능.
- **viewport meta 태그**와 상대 단위(`vw`/`vh`) 사용. 고정 픽셀 크기는 대표적 초보 실수 —
  안드로이드의 다양한 화면 비율에서 검은 띠/깨진 레이아웃 유발.
- **`devicePixelRatio`** 처리: HiDPI에서 캔버스 픽셀을 DPR만큼 곱하고 CSS로 다시 제약해 선명도 확보 —
  단, 저사양 폰에서 풀 DPR 렌더링은 성능을 파괴하므로 캡을 둘 것.
- **프레임워크(Phaser) 사용 시:** 수동 리사이즈 대신 Scale Manager(`FIT` 모드)를 쓸 것.

### 저사양 안드로이드 성능
- **GC가 적이다.** 저사양 안드로이드는 여유 메모리가 적어 게임 루프 내 잦은 할당이 GC 스터터를 유발.
  프레임당 객체/함수/배열 생성 회피, `splice()` 회피.
- **안드로이드 System WebView는 종종 구버전이고 업그레이드 불가** — 느리고 버그 있는 렌더러에 게임이
  묶임. "안드로이드에서만 느림"의 잦고 진단 어려운 원인. 실제 구형 안드로이드에서 반드시 테스트
  (에뮬레이터는 입력 지연·throttling을 숨김).
- **렌더 해상도를 낮춰라.** 고정 작은 캔버스(예: 너비 300–640 px)로 큰 FPS 이득을 봤다는 보고 흔함.
- **프레임 예산은 60 fps 기준 ~16.67 ms.** 고정 타임스텝 루프 사용 — 경과 실시간을 누적해 충분히
  쌓였을 때만 물리를 돌려, 30/60/120 Hz에서 동일하게 동작하게.

### 배터리 / Thermal
- iOS는 **저전력 모드에서 `requestAnimationFrame`을 30 fps로 스로틀**(교차 출처 iframe에서도).
  브라우저도 저사양 기기에서 rAF를 자동 스로틀. 게임은 60 fps를 가정하지 말고 가변/반감된 프레임
  레이트를 우아하게 처리해야 함.
- 프레임 레이트 캡, draw call 감소, wakeup 최소화가 배터리 소모·발열을 직접 줄인다. 무거운 비-렌더
  작업은 **Web Worker**로. 탭이 백그라운드면(`visibilitychange`) 루프를 일시정지.
- 출처: [When iOS throttles requestAnimationFrame — Popmotion](https://popmotion.io/blog/20180104-when-ios-throttles-requestanimationframe/),
  [WebGL Resizing the Canvas — WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html),
  [Auto-Resizing HTML5 Games — web.dev](https://web.dev/case-studies/gopherwoord-studios-resizing-html5-games),
  [Performant Game Loops in JavaScript](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/),
  [Common Mistakes in HTML5 Game Dev — Medium](https://medium.com/@william.miller5612/common-mistakes-in-html5-game-development-and-how-to-avoid-them-daec2572efd4)

---

## 6. 에셋 관리

### 스프라이트 아틀라스
- **모든 스프라이트를 텍스처 아틀라스로 패킹.** 많은 작은 텍스처를 하나의 GPU 단위로 다루면 draw call,
  디스크 I/O, 컨텍스트 전환 오버헤드가 줄어든다 — "메모리·처리력이 부족한 모바일에서 특히 중요."
  WebGL에서는 가능하면 **하나의 아틀라스**로 통합, Phaser에서는 씬에서 활성인 스프라이트를 같은
  아틀라스에 둘 것.
- **TexturePacker** 같은 툴이 자동 패킹·여백 트림·동일 프레임 중복 제거. 거대한 아틀라스 하나보다
  용도별(레벨별 등)로 분할.
- Phaser 한정: `tileSprite` 남용은 알려진 모바일 성능 킬러 — **작은 스프라이트 다수**를 선호.

### 텍스처 압축 & 치수
- 텍스처 치수는 **품질이 허용하는 한 작게**, 실수로 거대해진 텍스처가 없는지 점검. GPU 압축 포맷
  (ETC1/ETC2, ASTC, PVRTC, **Basis Universal**)이 런타임 메모리를 줄임 — 웹 크로스플랫폼은 Basis가 실용적.
  대부분의 2D 웹게임은 잘 최적화된 PNG/WebP 아틀라스로 충분. 압축 포맷은 3D/대용량 텍스처에서 더 중요.

### 오디오 포맷
- **WebM/OGG 기본, MP3 폴백.** WebM은 거의 전 브라우저 커버 + 최적의 크기/품질 균형, MP3가 나머지 커버.
  압축 오디오는 WAV의 ~1/10 크기.
- **Howler.js** 사용 — 포맷 폴백, 모바일 오디오 언락, 사운드 캐싱/재사용을 대신 처리. **오디오
  스프라이트**(파일 하나에 여러 클립)로 HTTP 요청 절감.

### 번들 크기 & 로딩 전략
- **모든 에셋을 온디맨드로 로드하는 것은 "네트워크 킬러"** — 특히 모바일. 전부 선로드하면 스터터,
  아무것도 선로드 안 하면 게임 중 끊김.
- 권장: **씬 단위로 분할**, 각 씬에 필요한 것만 프리로드, 로딩 바 표시, 이후 레벨은 백그라운드
  지연 로드(Phaser는 씬별 `preload()`가 정석 패턴).
- 동적 텍스트 렌더링은 모바일에서 "비싸다" — 비트맵 폰트가 낫다.
- 출처: [Texture atlas — Wikipedia](https://en.wikipedia.org/wiki/Texture_atlas),
  [TexturePacker texture settings — CodeAndWeb](https://www.codeandweb.com/texturepacker/documentation/texture-settings),
  [Optimize Phaser games: more sprites, less tileSprites — Emanuele Feronato](https://emanueleferonato.com/2017/01/05/optimize-your-phaser-html5-games-on-mobile-devices-by-using-more-sprites-and-less-tilesprites/),
  [Howler.js](https://howlerjs.com/), [Textures — Android Developers](https://developer.android.com/games/optimize/textures)

---

## 7. 2D vs 3D — 첫 모바일 웹게임

**커뮤니티 합의는 강하게 "2D로 시작하라."** 반복 인용되는 이유:
- **에셋 제작이 훨씬 빠름** — 스프라이트/타일 vs 3D 모델·UV·리그·애니메이션·라이팅.
- **기술적 단순함** — 2D 물리·충돌·렌더링은 엣지 케이스가 훨씬 적음(카메라 클리핑·LOD·메시 변형·셰이더 없음).
- **낮은 학습 곡선과 더 나은 초보 툴링** — 프로젝트를 실제로 *완성*할 확률이 훨씬 높음.
- **성능 여유** — 2D가 저사양 모바일 GPU에 훨씬 너그러움.
- 3D로의 이동은 기본기가 탄탄해진 뒤, 또는 디자인이 진정 깊이를 요구할 때만.
- 출처: [2D vs 3D for Beginners — GameDev.net](https://gamedev.net/forums/topic/643153-2d-vs-3d/),
  [Best way to start, 2d or 3d? — Babylon.js forum](https://forum.babylonjs.com/t/best-way-to-start-2d-or-3d/25318)

---

## 8. 배포 / 유통 / 수익화

### 호스팅
- 웹게임은 정적 파일일 뿐 — 정적 호스팅/CDN(itch.io, GitHub Pages, Netlify, Cloudflare Pages)에 저렴하게 호스팅.

### 포털 (실질적으로 가장 큰 유통 채널인 경우가 많음)
- **CrazyGames, Poki, CoolMathGames, ArmorGames** 등 포털에 라이선싱 — 트래픽 제공 + 수익 분배.
  타이틀당 수백~수천 달러 보고. GameMonetize/GameDistribution 같은 애그리게이터가 다수 포털에 일괄 신디케이션.

### PWA 래핑
- PWA는 앱스토어 없이 설치 가능 — 심사 없음, 스토어 수수료 없음, 오프라인 플레이, 첫 플레이까지 마찰 감소.
  강한 조언: 나중에 개조하지 말고 **PWA 우선 설계**(오프라인·설치 플로우·푸시).
- 실제 앱스토어 입점은 **Capacitor/Cordova**로 래핑(또는 엔진 네이티브 익스포트). 단, 네이티브 WebView가
  느릴 수 있다는 역사적 주의 — 래핑 빌드를 직접 테스트할 것.

### 수익화
- **광고가 기반:** 리워드 비디오(플레이어 수용도 최고), 인터스티셜(레벨/세션 사이), 배너.
- **하이브리드 모델이 이긴다:** 포털 수익분배 + 광고 + 선택적 IAP/코스메틱을 결합.
- IAP나 의미 있는 점수를 추가하면 **서버에서 검증** — `localStorage`는 쉽게 조작되니 게임 상태를 믿지 말 것.
- 출처: [How to Monetize HTML5 Games in 2025 — Genieee](https://genieee.com/blogs/how-to-monetize-html5-games-in-2025-your-complete-guide/),
  [Build an HTML5 game and distribute it — Mozilla Hacks](https://hacks.mozilla.org/2015/06/build-an-html5-game-and-distribute-it/),
  [HTML5 Game Development Trends 2025 — Playgama](https://playgama.com/blog/general/top-html5-game-development-trends-in-2024-and-beyond/)

---

## 9. 초보자 흔한 실수 & "다시 시작한다면"

| 실수 | 해법 |
|---|---|
| **스코프 크리프** — #1 킬러. 비전이 부풀어 게임이 출시되지 못함 | 초반에 빡빡한 스코프 정의. 코어 루프 먼저, 복잡도는 시간 남으면 추가 |
| **데스크톱 우선 / 고정 픽셀 레이아웃** | 모바일 우선. viewport meta, 상대 단위, Scale Manager, 실기기 테스트 |
| **모든 에셋 온디맨드 로드** | 씬별 프리로드, 로딩 바, 이후 콘텐츠 지연 로드 |
| **게임 루프 내 할당** → 안드로이드 GC 스터터 | 총알/적/파티클 오브젝트 풀링, 객체 재사용, 프레임당 할당 회피 |
| **에뮬레이터/고사양 폰에서만 테스트** | 싼 구형 안드로이드를 사라 — 실기기가 입력 지연·throttling을 드러냄 |
| **모든 브라우저가 같다고 가정** | Canvas/WebGL 동작은 Chrome/Firefox/Safari마다 다름 — 특히 Safari/iOS 테스트 |
| **무거운 물리(Matter.js/P2, 복잡 폴리곤)** | Arcade 물리/단순 원형 콜라이더, 충돌 검사 배치, 화면 밖 물리 비활성화 |
| **FPS 계측 없음** | 첫날부터 FPS 카운터 추가, 최적화 전에 측정 |
| **프로덕션에 물리/디버그 렌더링 켜둠** | 프로덕션 빌드는 물리 `debug: false` |

**출시 경험 개발자의 "다시 시작한다면" 노트:** 반복적으로 지목되는 고통 지점은 **타이머, 오디오,
컨트롤러 지원, 가비지 컬렉션** — 이것들에 추가 시간을 배정하라. 전반적 정서는 "HTML/JS는 그 거친
모서리를 존중하면 강력하고 저평가된 게임 플랫폼"이라는 것.
출처: [HTML/JS as a game dev platform — Hacker News](https://news.ycombinator.com/item?id=21574458),
[Common Mistakes in HTML5 Game Dev — Medium](https://medium.com/@william.miller5612/common-mistakes-in-html5-game-development-and-how-to-avoid-them-daec2572efd4)

---

## 10. 2023–2025 동향

- **시장 모멘텀:** HTML5 게임 시장 ~$9.8B(2024) → ~$14.3B(2025) 성장. 브라우저 릴리스에 대한 개발자
  관심은 10년 내 최고 — 한 설문에서 ~16%의 개발자가 브라우저 게임 릴리스를 진행 중(2023–24의 ~10–11%에서 상승).
- **WebAssembly:** "진지한" HTML5 게임의 전환점으로 널리 평가 — 네이티브에 가까운 실행, 무거운 물리/AI
  처리 가능. UE5는 WebGPU 백엔드 추가(2024.4), Unity는 WebGPU를 Unity 6의 핵심 동인으로 포지셔닝.
- **WebGPU:** 실험 단계에서 프로덕션으로 이동. Chrome/Edge/Firefox 기본 활성화, 2026년 1월 Firefox 147 +
  Safari(iOS 26 / macOS Tahoe 26)에서 기본 활성화로 크로스브라우저 지원 도달. 차세대 경로(컴퓨트,
  파티클, 레이트레이싱, 120Hz)로 평가 — 단, *오늘의 모바일 웹게임*에는 Phaser/PixiJS/Three.js 위의
  WebGL이 여전히 실용적이고 폭넓게 지원되는 선택.
- **장르 이동:** HTML5에서 하이퍼캐주얼이 여전히 우세하지만, **하이브리드 캐주얼**(더 깊은 게임플레이,
  진행 시스템, 더 나은 수익화)로 이동 중.
- **남은 마찰:** 기술적 실현 가능성에도 불구, 개발자들은 **툴체인 한계와 표준화된 퍼블리싱 파이프라인의
  부재**를 더 많이 웹에 출시하지 않는 주된 이유로 꼽음. iOS Safari 특유의 문제(오디오 게이팅, 과거
  스토리지 한도)도 반복되는 불만.
- 출처: [The Rise of HTML5 Games: Browser Gaming in 2025 — DEV](https://dev.to/gamh5games/the-rise-of-html5-games-how-browser-gaming-is-evolving-in-2025-35dm),
  [What's Next for WebGPU — Hacker News](https://news.ycombinator.com/item?id=42209272),
  [Unity sees WebGPU as a growing market — Game Developer](https://www.gamedeveloper.com/programming/unity-sees-webgpu-is-a-growing-market-for-game-development)

---

## 11. 결론 — 커뮤니티에서 도출한 권장안

오늘 시작하는 전형적인 **2D 모바일 웹게임** 기준:
1. **프레임워크:** Phaser 3 — 모바일에서 필요한 Scale Manager + Mobile Pipeline 보유. 번들/raw FPS가
   사활적이고 엔진 레이어를 직접 짤 거면 PixiJS.
2. **언어:** TypeScript — Phaser의 빈약한 문서 때문에 효과가 가장 큰 조합.
3. **툴링:** Vite, 공식 `phaserjs/template-vite-ts`에서 시작.
4. **첫날부터 모바일 빌드:** 오브젝트 풀링, 고정/저 렌더 해상도 + 업스케일(`devicePixelRatio` 유의),
   텍스처 아틀라스, WebP/압축 오디오, 페이로드 ~3–5 MB 유지, `touchstart`(`click` 아님),
   iOS 오디오 언락용 tap-to-start 게이트, 실제 중·저사양 폰에서 테스트.
5. **3D를 한다면:** Three.js(가볍게, 직접 최적화) 또는 PlayCanvas(모바일 최적화 + 에디터).
   나중에 네이티브 모바일/콘솔 익스포트도 원하면 Defold.

---

## 출처 모음

- [Phaser vs PixiJS for making 2D games — DEV](https://dev.to/ritza/phaser-vs-pixijs-for-making-2d-games-2j8c)
- [WebGL Libraries for 2D games: Pixi vs Phaser — fgfactory](https://fgfactory.com/webgl-libraries-for-2d-games)
- [Phaser 3.60 MobilePerformance changelog — GitHub](https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/MobilePerformance.md)
- [PixiJS or Phaser? — HTML5GameDevs](https://www.html5gamedevs.com/topic/46899-question-pixiejs-or-phaserio/)
- [js-game-rendering-benchmark — GitHub](https://github.com/Shirajuki/js-game-rendering-benchmark)
- [Three.js vs Babylon.js — LogRocket](https://blog.logrocket.com/three-js-vs-babylon-js/)
- [Three.js vs Babylon.js vs PlayCanvas — Utsubo](https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison)
- [Defold vs PlayCanvas — Slant](https://www.slant.co/versus/1117/5149/~defold_vs_playcanvas)
- [Best JS/HTML5 game engines 2025 — LogRocket](https://blog.logrocket.com/best-javascript-html5-game-engines-2025/)
- [[Mobile Games] Unity vs Defold vs Godot — Defold forum](https://forum.defold.com/t/mobile-games-unity-vs-defold-vs-godot-which-engine/67042)
- [Optimizing HTML5 Action Games for Mobile — DEV](https://dev.to/gamh5games/optimizing-html5-action-games-for-mobile-devices-19ce)
- [What to do when your HTML5 game runs slow on mobile — Game Developer](https://www.gamedeveloper.com/programming/what-to-do-when-your-html5-game-runs-slow-on-mobile-devices)
- [Best practices of building mobile-friendly HTML5 games — Gamedev.js](https://gamedevjs.com/articles/best-practices-of-building-mobile-friendly-html5-games/)
- [Disappointed with HTML5 perf on mobile — HTML5GameDevs](https://www.html5gamedevs.com/topic/23113-disappointed-with-general-html5-games-performance-on-mobile-devices/)
- [How to improve performance on mobile — HTML5GameDevs](https://www.html5gamedevs.com/topic/14036-how-to-improve-performance-on-mobile/)
- [How I optimized my Phaser 3 action game in 2025 — Phaser](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025)
- [Tips on speeding up Phaser games — GitHub gist (MarcL)](https://gist.github.com/MarcL/748f29faecc6e3aa679a385bffbdf6fe)
- [Fixing HTML5 Audio on iOS/Android — Code Theory](https://codetheory.in/fixing-html5-audio-problems-in-ios-and-android-mobile-browsers-to-overcome-the-limitations/)
- [TypeScript vs Pure JavaScript — HTML5GameDevs](https://www.html5gamedevs.com/topic/40709-typescript-vs-pure-javascript-code/)
- [JavaScript VS TypeScript — Phaser Discourse](https://phaser.discourse.group/t/javascript-vs-typescript/5872)
- [Easily Use TypeScript with Phaser 3 — Ourcade](https://blog.ourcade.co/posts/2020/phaser-3-typescript/)
- [6 months building a game with Phaser + TypeScript — Hacker News](https://news.ycombinator.com/item?id=16373214)
- [Phaser + Vite Template — Phaser](https://phaser.io/news/2024/01/phaser-vite-template)
- [phaserjs/template-vite-ts — GitHub](https://github.com/phaserjs/template-vite-ts)
- [ourcade/phaser3-vite-template — GitHub](https://github.com/ourcade/phaser3-vite-template)
- [How to setup a Phaser 3 project with Vite — saricden](https://saricden.com/how-to-setup-a-phaser-3-project-with-vite)
- [When iOS throttles requestAnimationFrame — Popmotion](https://popmotion.io/blog/20180104-when-ios-throttles-requestanimationframe/)
- [WebGL Resizing the Canvas — WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html)
- [Auto-Resizing HTML5 Games — web.dev](https://web.dev/case-studies/gopherwoord-studios-resizing-html5-games)
- [Performant Game Loops in JavaScript — Aleksandr Hovhannisyan](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/)
- [Common Mistakes in HTML5 Game Development — Medium](https://medium.com/@william.miller5612/common-mistakes-in-html5-game-development-and-how-to-avoid-them-daec2572efd4)
- [Texture atlas — Wikipedia](https://en.wikipedia.org/wiki/Texture_atlas)
- [TexturePacker texture settings — CodeAndWeb](https://www.codeandweb.com/texturepacker/documentation/texture-settings)
- [Optimize Phaser games: more sprites, less tileSprites — Emanuele Feronato](https://emanueleferonato.com/2017/01/05/optimize-your-phaser-html5-games-on-mobile-devices-by-using-more-sprites-and-less-tilesprites/)
- [Howler.js](https://howlerjs.com/) · [GitHub: howler.js](https://github.com/goldfire/howler.js/)
- [Textures — Android Developers](https://developer.android.com/games/optimize/textures)
- [2D vs 3D for Beginners — GameDev.net](https://gamedev.net/forums/topic/643153-2d-vs-3d/)
- [Best way to start, 2d or 3d? — Babylon.js forum](https://forum.babylonjs.com/t/best-way-to-start-2d-or-3d/25318)
- [Build an HTML5 game and distribute it — Mozilla Hacks](https://hacks.mozilla.org/2015/06/build-an-html5-game-and-distribute-it/)
- [How to Monetize HTML5 Games in 2025 — Genieee](https://genieee.com/blogs/how-to-monetize-html5-games-in-2025-your-complete-guide/)
- [HTML5 Game Development Trends 2025 — Playgama](https://playgama.com/blog/general/top-html5-game-development-trends-in-2024-and-beyond/)
- [The Rise of HTML5 Games: Browser Gaming in 2025 — DEV](https://dev.to/gamh5games/the-rise-of-html5-games-how-browser-gaming-is-evolving-in-2025-35dm)
- [What's Next for WebGPU — Hacker News](https://news.ycombinator.com/item?id=42209272)
- [Unity sees WebGPU as a growing market — Game Developer](https://www.gamedeveloper.com/programming/unity-sees-webgpu-is-a-growing-market-for-game-development)
- [HTML/JS as a game dev platform — Hacker News](https://news.ycombinator.com/item?id=21574458)
