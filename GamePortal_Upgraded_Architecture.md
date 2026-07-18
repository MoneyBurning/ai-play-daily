# 🎮 AI GAME FACTORY — 업그레이드 설계서 v2.0

> 벤치마크: Poki, itch.io, Kongregate, Miniclip 분석 기반

---

## ✅ 원본 대비 핵심 업그레이드 포인트 5가지

| 항목 | 원본 v1 | 업그레이드 v2 |
|------|---------|--------------|
| 데이터 관리 | 정적 games.json | games.json + LocalStorage 캐시 + 검색 인덱스 |
| 디자인 방향 | "Steam + Google Play" (막연) | Poki식 밝은 카드 + itch.io의 개성 혼합 |
| 광고 구조 | Phase 3에 뭉뚱그림 | 게임 로딩 중 / 게임 오버 시점 명확히 분리 |
| SEO | 언급 없음 | 게임별 OG 태그 + Sitemap 자동생성 |
| 분석 | 없음 | 플레이 시간 / 이탈률 자체 트래킹 (GA4) |

---

## 1. 프로젝트명 & 브랜딩

```
AI PLAY DAILY
슬로건: "Every day, a brand new game. Made by AI."
```

**왜 바꾸나?**
- "Factory"는 대량생산 느낌 → 품질 의심
- "PLAY DAILY" = 습관 형성 유도 (Daily Wordle 효과)
- URL 예: aiplaydaily.com / aipd.io

---

## 2. 기술 스택 (업그레이드)

```
Frontend         : HTML5 + CSS3 (CSS Variables) + Vanilla JS
Game Engine      : Phaser.js 3.x  (기존 유지)
검색/필터        : Fuse.js (경량 퍼지 검색, 5KB)
Analytics        : Google Analytics 4 (무료)
Hosting          : Cloudflare Pages (무료, CDN 포함)
Version Control  : GitHub Actions (CI/CD 자동배포)
이미지 최적화    : WebP 포맷 + lazy loading
```

**추가 이유**
- Poki는 React/Redux를 쓰지만 30M 유저 규모
- 초기엔 Vanilla JS가 빌드 없고 SEO 친화적
- Fuse.js로 게임 검색 가능 (Poki 핵심 기능)

---

## 3. 폴더 구조 (업그레이드)

```
ai-play-daily/
│
├── index.html               ← 메인 홈
├── games.html               ← 전체 게임 목록 + 필터
├── about.html
│
├── game/
│   └── [slug].html          ← 게임 플레이 템플릿 (1개 재사용)
│
├── games/
│   ├── snake-ai/
│   │   ├── game.js
│   │   └── manifest.json    ← ★ 게임별 메타데이터
│   └── zombie-runner/
│       ├── game.js
│       └── manifest.json
│
├── data/
│   ├── games.json           ← 전체 게임 카탈로그
│   └── categories.json      ← 카테고리 정의
│
├── assets/
│   ├── thumbnails/          ← WebP 썸네일 (300x200)
│   ├── og-images/           ← OG 썸네일 (1200x630)
│   └── sounds/
│
├── js/
│   ├── main.js              ← 홈 로직
│   ├── catalog.js           ← 게임 카드 렌더링
│   ├── search.js            ← Fuse.js 검색
│   └── analytics.js         ← GA4 + 자체 플레이타임 트래킹
│
├── css/
│   ├── tokens.css           ← CSS 변수 (색상/폰트/간격)
│   ├── components.css       ← 카드, 버튼, 모달
│   └── layout.css           ← 그리드, 반응형
│
└── scripts/
    └── generate-sitemap.js  ← GitHub Actions로 자동 실행
```

---

## 4. manifest.json (게임별 메타 — 신규)

기존 games.json보다 **게임별 분산 관리**:

```json
{
  "id": "snake-ai",
  "title": "AI Snake",
  "description": "AI가 최적 경로를 찾는 스네이크 게임",
  "category": ["arcade", "ai"],
  "tags": ["snake", "AI", "casual"],
  "thumbnail": "/assets/thumbnails/snake-ai.webp",
  "og_image": "/assets/og-images/snake-ai.webp",
  "date": "2026-07-17",
  "author": "AI Play Daily",
  "engine": "Phaser 3",
  "controls": {
    "keyboard": ["Arrow Keys", "WASD"],
    "mobile": true
  },
  "stats": {
    "avg_playtime_sec": 180,
    "difficulty": "easy"
  },
  "featured": true,
  "status": "live"
}
```

**장점**: 게임 추가 = manifest.json만 작성 → CI가 games.json 자동 빌드

---

## 5. 메인 페이지 구조 (Poki 벤치마크)

```
┌─────────────────────────────────────────────────┐
│  LOGO   [검색창 🔍]          [All Games] [About] │ ← sticky header
├─────────────────────────────────────────────────┤
│                                                 │
│  🎮 오늘의 NEW GAME                             │ ← 히어로 섹션
│  ┌──────────────────┐  AI Snake                 │
│  │                  │  "AI가 스스로 먹이를 찾아" │
│  │  [GAME GIF/IMG]  │                           │
│  │                  │  ★★★★☆  |  Arcade  |  Easy│
│  └──────────────────┘                           │
│                  [▶ PLAY NOW]                   │
│                                                 │
├─────────────────────────────────────────────────┤
│  카테고리 필터                                  │
│  [ALL] [Arcade] [Puzzle] [AI] [Action] [Casual] │
├─────────────────────────────────────────────────┤
│  🔥 인기 게임 TOP 3                             │
│  ┌────┐  ┌────┐  ┌────┐                         │
│  │ 1  │  │ 2  │  │ 3  │  ← 플레이 수 기반       │
│  └────┘  └────┘  └────┘                         │
├─────────────────────────────────────────────────┤
│  🆕 최신 게임 (카드 그리드)                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │
│  │    │ │    │ │    │ │    │                   │
│  └────┘ └────┘ └────┘ └────┘                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │
│  │    │ │    │ │    │ │    │                   │
│  └────┘ └────┘ └────┘ └────┘                   │
│                [더 보기 ↓]                      │
├─────────────────────────────────────────────────┤
│  Footer: About | 게임 수: 30 | Made with Claude │
└─────────────────────────────────────────────────┘
```

---

## 6. 게임 플레이 페이지 (업그레이드)

```
┌─────────────────────────────────────────────────┐
│  < Back   AI Snake          [Share] [★ Like]    │
├──────────────────────┬──────────────────────────┤
│                      │  📊 Stats                │
│   [GAME IFRAME]      │  Played: 1,204           │
│   600 x 400          │  Avg Time: 3min          │
│                      │  Best Score: 240         │
│   [RESTART] [MUTE]   ├──────────────────────────┤
│                      │  🎮 Controls             │
│                      │  Arrow Keys / Swipe      │
├──────────────────────┴──────────────────────────┤
│  ℹ️ About this game                             │
│  AI가 A* 알고리즘으로 경로를 계산합니다...       │
├─────────────────────────────────────────────────┤
│  🎯 다음에 이 게임은 어떠세요?                  │
│  ┌────┐ ┌────┐ ┌────┐ ← 같은 카테고리 추천      │
└─────────────────────────────────────────────────┘
```

---

## 7. 광고 구조 (Poki SDK 방식 벤치마크)

```javascript
// 타이밍별 광고 배치 (itch.io + Poki 혼합)

GAME LOAD START → 로딩 스피너 위에 배너 광고
                  (사용자 이탈 최소화)

GAME OVER      → 인터스티셜 광고 (5초 skip)
                  → "다시 하기" 클릭 전 노출

STAGE CLEAR    → 작은 배너 (게임 흐름 방해 최소)

HOMEPAGE       → 사이드바 또는 카드 사이 네이티브 광고
```

**핵심 원칙**: 게임 플레이 중 절대 광고 없음 → 이탈률 방지

---

## 8. 디자인 토큰 (구체화)

```css
:root {
  /* Colors — Poki 밝음 + itch.io 개성 */
  --color-bg:        #F7F8FC;   /* 거의 흰 블루그레이 */
  --color-surface:   #FFFFFF;
  --color-primary:   #5B6BFF;   /* 바이올렛 블루 */
  --color-accent:    #FF6B6B;   /* 코랄 레드 (CTA) */
  --color-tag-bg:    #EEF0FF;
  --color-text:      #1A1D2E;
  --color-muted:     #8890A4;

  /* Typography */
  --font-display:    'Space Grotesk', sans-serif;  /* 게임감 있는 기하학체 */
  --font-body:       'Inter', sans-serif;

  /* Radius */
  --radius-card:     16px;
  --radius-btn:      50px;      /* pill 버튼 → 게임느낌 */

  /* Shadow */
  --shadow-card:     0 4px 20px rgba(91,107,255,0.12);
}
```

---

## 9. SEO 전략 (원본에 없던 항목)

각 게임 페이지 자동 생성 메타태그:

```html
<!-- 게임별 OG 태그 -->
<meta property="og:title" content="AI Snake — AI Play Daily">
<meta property="og:image" content="/assets/og-images/snake-ai.webp">
<meta property="og:description" content="AI가 스스로 경로를 찾는 스네이크 게임">
<meta name="twitter:card" content="summary_large_image">

<!-- Structured Data (Google 게임 검색) -->
<script type="application/ld+json">
{
  "@type": "VideoGame",
  "name": "AI Snake",
  "genre": "Arcade",
  "playMode": "SinglePlayer",
  "applicationCategory": "BrowserGame"
}
</script>
```

→ Google에서 "무료 스네이크 게임"으로 검색 시 노출 가능

---

## 10. 개발 페이즈 (업그레이드)

### Phase 0 — 인프라 (3일)
- [ ] GitHub 레포 + Cloudflare Pages 연결
- [ ] CSS 토큰 시스템 완성
- [ ] games.json 스키마 확정
- [ ] 게임 플레이 페이지 템플릿 1개 완성

### Phase 1 — 런칭 (Day 1~7)
- [ ] 홈페이지 완성
- [ ] 게임 3개 업로드 (스네이크, 퍼즐, 러너)
- [ ] 검색 기능 (Fuse.js)
- [ ] 모바일 완전 대응

### Phase 2 — 성장 (Day 8~30)
- [ ] 매일 게임 1개 업로드
- [ ] GA4 설치 + 플레이타임 트래킹
- [ ] 카테고리 필터
- [ ] "오늘의 게임" 자동화

### Phase 3 — 수익화 (Day 31~)
- [ ] Google AdSense 승인
- [ ] 광고 타이밍 로직 구현
- [ ] 게임 내 소셜 공유 (X/Threads)
- [ ] 점수 랭킹 (LocalStorage 기반)

---

## 11. Claude Code 개발 명령어 예시

```
# 홈페이지 생성
"index.html과 CSS 토큰 시스템을 만들어줘.
 색상: primary #5B6BFF, accent #FF6B6B, bg #F7F8FC
 폰트: Space Grotesk + Inter
 게임 카드 그리드 (4열/모바일 2열)
 games.json에서 fetch해서 카드 렌더링"

# 게임 추가
"games/ 폴더에 memory-match 게임 추가.
 Phaser.js 3 사용, 모바일 터치 지원,
 manifest.json 포함, 카테고리: puzzle"

# 검색 기능
"Fuse.js로 게임 제목+태그 퍼지 검색 구현.
 실시간 필터링, 결과 없을 때 빈 상태 메시지"
```

---

## 12. 30일 후 목표 지표

| 지표 | 목표 |
|------|------|
| 게임 수 | 25~30개 |
| 일일 방문자 | 500+ |
| 평균 체류시간 | 5분+ |
| 게임 플레이율 | 방문자의 60%+ |
| AdSense 승인 | ✅ |

---

> **핵심 철학**: Poki처럼 "즉시 플레이"가 최우선.  
> 클릭 2번 이내에 게임 시작. 로딩 3초 이내.  
> 게임 퀄리티보다 **매일 업로드하는 리듬**이 성장의 핵심.
