# AI Play Daily — 프로젝트 지침

> Claude Code가 이 파일을 항상 먼저 읽습니다.
> 모든 작업은 이 지침을 기준으로 진행하세요.

---

## 프로젝트 개요

- **목표**: 매일 게임 1개씩 업로드하는 웹 게임 포털
- **슬로건**: "Every day, a brand new game. Made by AI."
- **도메인 예시**: aiplaydaily.com
- **수익화**: Google AdSense (게임 로드 시 / 게임 오버 시)

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Game Engine | Phaser.js 3 (CDN) |
| 검색 | Fuse.js (CDN, 경량 퍼지 검색) |
| Analytics | Google Analytics 4 |
| Hosting | Cloudflare Pages (무료) |
| 버전 관리 | GitHub |
| 이미지 | WebP 포맷 + lazy loading |

---

## 폴더 구조

```
ai-play-daily/
│
├── CLAUDE.md                ← 이 파일
├── index.html               ← 메인 홈
├── games.html               ← 전체 게임 목록 + 필터
├── about.html
│
├── game/
│   └── [slug].html          ← 게임 플레이 템플릿 (1개 재사용)
│
├── games/
│   └── [game-slug]/
│       ├── game.js
│       └── manifest.json    ← 게임별 메타데이터
│
├── data/
│   ├── games.json           ← 전체 게임 카탈로그 (자동 생성)
│   └── categories.json
│
├── assets/
│   ├── thumbnails/          ← WebP 300x200
│   └── og-images/           ← WebP 1200x630
│
├── js/
│   ├── main.js
│   ├── catalog.js
│   ├── search.js
│   └── analytics.js
│
└── css/
    ├── tokens.css
    ├── components.css
    └── layout.css
```

---

## 디자인 토큰

```css
:root {
  --color-bg:       #F7F8FC;
  --color-surface:  #FFFFFF;
  --color-primary:  #5B6BFF;
  --color-accent:   #FF6B6B;
  --color-tag-bg:   #EEF0FF;
  --color-text:     #1A1D2E;
  --color-muted:    #8890A4;

  --font-display:   'Space Grotesk', sans-serif;
  --font-body:      'Inter', sans-serif;

  --radius-card:    16px;
  --radius-btn:     50px;

  --shadow-card:    0 4px 20px rgba(91,107,255,0.12);
}
```

---

## manifest.json 스키마 (게임 추가 시 필수)

```json
{
  "id": "game-slug",
  "title": "게임 이름",
  "description": "한 줄 설명",
  "category": ["arcade"],
  "tags": ["casual", "ai"],
  "thumbnail": "/assets/thumbnails/game-slug.webp",
  "og_image": "/assets/og-images/game-slug.webp",
  "date": "YYYY-MM-DD",
  "controls": {
    "keyboard": ["Arrow Keys"],
    "mobile": true
  },
  "featured": false,
  "status": "live"
}
```

---

## 카테고리 목록

`arcade` `puzzle` `action` `ai` `casual` `strategy` `simulation`

---

## 게임 추가 워크플로우

1. `games/[slug]/` 폴더 생성
2. `game.js` 작성 (Phaser.js 3)
3. `manifest.json` 작성
4. `data/games.json`에 항목 추가
5. `assets/thumbnails/`에 WebP 썸네일 추가
6. `git commit -m "feat: [게임명] 추가"`
7. `git push` → Cloudflare 자동 배포

---

## 광고 배치 규칙

- ✅ 게임 로딩 중 → 배너 광고
- ✅ 게임 오버 시 → 인터스티셜 (5초 skip)
- ✅ 홈페이지 카드 사이 → 네이티브 광고
- ❌ 게임 플레이 중 → 절대 광고 없음

---

## SEO 규칙

모든 게임 페이지에 아래 태그 포함:

```html
<meta property="og:title" content="[게임명] — AI Play Daily">
<meta property="og:image" content="/assets/og-images/[slug].webp">
<meta property="og:description" content="[설명]">
<meta name="twitter:card" content="summary_large_image">
```

---

## 코딩 규칙

- 다크모드 없음, 라이트 모드 고정
- 모바일 터치 지원 필수 (모든 게임)
- 카드 클릭 2번 이내 게임 시작
- 게임 로딩 3초 이내 목표
- 외부 라이브러리는 CDN만 사용 (빌드 도구 없음)
- `games.json`은 `manifest.json`에서 자동 생성
