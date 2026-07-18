# Flappy Paws 전체 구현 — Claude Code용

아래 9개 STEP을 순서대로 하나씩 완료해줘.
각 STEP 완료 후 반드시 git commit + push 하고 다음으로 넘어가.
에러 나면 즉시 수정 후 재시도.

---

## STEP 1 — 뼈대 + 전역 상태

`games/flappy-paws/game.js` 와 `games/flappy-paws/manifest.json` 새로 생성.

**manifest.json:**
```json
{
  "id": "flappy-paws",
  "title": "Flappy Paws",
  "description": "귀여운 동물과 함께하는 더블점프 플래피버드! 스킨을 해제하고 심우주까지 날아가세요.",
  "category": ["arcade", "casual"],
  "tags": ["casual", "arcade", "cute"],
  "thumbnail": "/assets/thumbnails/flappy-paws.webp",
  "og_image": "/assets/og-images/flappy-paws.webp",
  "date": "2026-07-19",
  "controls": { "keyboard": ["Space"], "mobile": true },
  "featured": true,
  "status": "live"
}
```

**game.js 구조:**

파일 최상단 전역 상태:
```js
const PAWS = {
  score: 0,
  bestScores: [],
  selectedSkin: 0,
  unlockedSkins: [true, false, false, false, false],
  doubleJumpCount: 0,
  totalGames: 0,
  achievements: {},
  combo: 0,
  bestCombo: 0,
  currentTheme: 'day',
};

function saveState() {
  localStorage.setItem('fp_best', JSON.stringify(PAWS.bestScores));
  localStorage.setItem('fp_skin', PAWS.selectedSkin);
  localStorage.setItem('fp_unlocked', JSON.stringify(PAWS.unlockedSkins));
  localStorage.setItem('fp_djcount', PAWS.doubleJumpCount);
  localStorage.setItem('fp_games', PAWS.totalGames);
  localStorage.setItem('fp_ach', JSON.stringify(PAWS.achievements));
  localStorage.setItem('fp_bestcombo', PAWS.bestCombo);
}

function loadState() {
  try {
    PAWS.bestScores    = JSON.parse(localStorage.getItem('fp_best'))     || [];
    PAWS.selectedSkin  = parseInt(localStorage.getItem('fp_skin'))        || 0;
    PAWS.unlockedSkins = JSON.parse(localStorage.getItem('fp_unlocked')) || [true,false,false,false,false];
    PAWS.doubleJumpCount = parseInt(localStorage.getItem('fp_djcount'))  || 0;
    PAWS.totalGames    = parseInt(localStorage.getItem('fp_games'))       || 0;
    PAWS.achievements  = JSON.parse(localStorage.getItem('fp_ach'))      || {};
    PAWS.bestCombo     = parseInt(localStorage.getItem('fp_bestcombo'))  || 0;
  } catch(e) {}
}
```

4개 씬 클래스 (내용은 stub):
- `BootScene` : create()에서 loadState() → scene.start('SkinScene')
- `SkinScene` : create()에서 텍스트만 → scene.start('GameScene') (임시)
- `GameScene` : create()/update() 빈 함수
- `GameOverScene` : create()에서 "GAME OVER" 텍스트

Phaser config:
```js
const config = {
  type: Phaser.AUTO,
  width: 480, height: 640,
  parent: document.querySelector('.game-stage') || document.body,
  backgroundColor: '#87CEEB',
  physics: { default: 'arcade', arcade: { gravity: { y: 1800 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, SkinScene, GameScene, GameOverScene]
};
new Phaser.Game(config);
```

완료: `git add games/flappy-paws/ && git commit -m "feat: flappy-paws STEP1 뼈대" && git push`

---

## STEP 2 — Texture Cache

BootScene create()에 텍스처 사전 생성 코드 추가.
**중요: 이후 모든 씬에서 new Graphics() 금지, 텍스처 키만 사용.**

생성할 텍스처 (모두 Graphics → generateTexture):

**새 스킨 5종 (48x48):**
- `bird_0` 병아리: 노란원(#FFD600) r=20, 주황부리 삼각형, 검정눈 r=4
- `bird_1` 고양이: 회색원(#90A4AE) r=20, 삼각귀 2개, 검정눈, 분홍코, 수염선
- `bird_2` 개구리: 초록원(#69F0AE) r=20, 흰큰눈 r=8+검정눈 r=4, 미소호
- `bird_3` 토끼: 흰원(#FAFAFA) r=20 테두리(#E0E0E0), 분홍타원귀, 검정눈, 분홍코
- `bird_4` 팬더: 흰원 r=20, 검정귀원 r=8, 검정눈패치타원, 흰눈원 r=3, 검정코

**파이프 3종 (60x400):**
- `pipe_day`: #4CAF50 몸통, #388E3C 테두리, #66BB6A 상단캡(너비+8)
- `pipe_evening`: #FF7043 몸통, #E64A19 테두리, #FF8A65 캡
- `pipe_night`: #7C4DFF 몸통, #651FFF 테두리, #B388FF 캡, 흰수직하이라이트선

**구름 3종:**
- `cloud_s`(80x40), `cloud_m`(120x55), `cloud_l`(160x65)
- 흰색 원 3개 겹쳐서 구름 실루엣

**기타:**
- `coin`(24x24): 노란원 r=11, 테두리, 중앙 '★' 흰텍스트
- `star_p`(12x12): 흰색 4방향 별 모양 (lineTo로)
- `medal_bronze`(64x64): #CD7F32 원, 테두리, 중앙 'B'
- `medal_silver`(64x64): #B0BEC5 원, 중앙 'S'
- `medal_gold`(64x64): #FFD600 원, 중앙 'G'
- `medal_platinum`(64x64): 흰원, 무지개 테두리(각도별 색 변경), 중앙 'P'
- `ground_day`(480x80): #8BC34A, 상단 2px #558B2F
- `ground_evening`(480x80): #795548, 상단 2px #4E342E
- `ground_night`(480x80): #37474F, 상단 2px #263238

완료 후 콘솔 `console.log('✅ Textures ready')` 출력.

완료: `git add games/flappy-paws/game.js && git commit -m "feat: flappy-paws STEP2 텍스처캐시" && git push`

---

## STEP 3 — SkinScene 완전 구현

SkinScene class 완전히 구현.

레이아웃:
- 배경: #87CEEB Rectangle + ground_day 하단
- "Flappy Paws" 타이틀 (Space Grotesk 28px bold #1A1D2E) x=240 y=45
- "Best: N" (Inter 14px #5B6BFF) x=440 y=20

스킨 카드 5개 (y=230):
- 각 카드 80x100, x간격 88, 시작x = 240 - 88*2 = 64
- 카드배경: 흰 둥근rect radius=12
- 카드안: bird_N 이미지 48x48
- 잠금: alpha=0.45 + '🔒' + 조건텍스트 (10점/25점/50점/100점)
- 선택된카드: #FF6B6B 테두리 3px + 위아래 bounce tween (-6px 반복)
- 해금된카드: #5B6BFF 테두리 2px + 클릭으로 선택

프리뷰 (y=390):
- 선택 스킨 80x80 크게 표시
- hover tween 위아래
- 스킨 이름 텍스트 (병아리/고양이/개구리/토끼/팬더)

PLAY 버튼 (y=530):
- #5B6BFF 둥근rect 160x50 radius=25
- '🐾 PLAY!' 흰텍스트 Space Grotesk 18px bold
- 클릭시 scale bounce → PAWS.selectedSkin 저장 → scene.start('GameScene')

해금 조건:
- skin_0: 항상 해금
- skin_1: bestScores[0] >= 10
- skin_2: bestScores[0] >= 25
- skin_3: bestScores[0] >= 50
- skin_4: bestScores[0] >= 100

잠긴카드 클릭: tween x ±5 흔들기 3회

완료: `git add games/flappy-paws/game.js && git commit -m "feat: flappy-paws STEP3 스킨씬" && git push`

---

## STEP 4 — 동적 배경

GameScene create()에 배경 시스템 구현.

테마 정의:
```js
const THEMES = {
  day:     { sky: 0x87CEEB, ground: 'ground_day',     pipe: 'pipe_day' },
  evening: { sky: 0xFF8A65, ground: 'ground_evening',  pipe: 'pipe_evening' },
  night:   { sky: 0x1A1D2E, ground: 'ground_night',   pipe: 'pipe_night' },
  space:   { sky: 0x000011, ground: 'ground_night',   pipe: 'pipe_night' },
};
// 전환: score 10→evening, 25→night, 50→space
```

레이어 depth:
- 0: 하늘 Rectangle
- 1: 장식(새/별/유성/오로라)
- 2: 구름
- 5: 파이프
- 8: 코인
- 10: 캐릭터
- 15: 지면
- 20: UI

구름 5개 Object Pool:
- cloud_s/m/l 랜덤, x=520→-180 이동
- y: Between(60,250), 속도: 게임속도×0.3
- 낮: alpha=0.85, 저녁: alpha=0.4, 밤+: setVisible(false)
- 화면 밖 나가면 오른쪽으로 리셋

changeTheme(newTheme):
- 하늘 색상 tween 1500ms
- 지면 텍스처 교체
- PAWS.currentTheme 업데이트

장식 오브젝트 (점수 구간별):
- 10점~: 작은 'V'새 2마리 배경 좌→우 사인파
- 25점~: 별 20개 alpha tween 깜빡임
- 50점~: 3초마다 유성우 (대각선 흰선 800ms)
- 75점~: 상단 20% 오로라 (초록/보라 웨이브, update마다 offset++)

지면: StaticGroup, height=80, y=600, ground_day 텍스처로 시작

완료: `git add games/flappy-paws/game.js && git commit -m "feat: flappy-paws STEP4 동적배경" && git push`

---

## STEP 5 — 캐릭터 + 점프 손맛

GameScene에 캐릭터 + 점프 시스템 구현. 파이프 충돌은 다음 STEP.

캐릭터:
```js
this.bird = this.physics.add.image(120, 300, 'bird_' + PAWS.selectedSkin).setDepth(10);
this.bird.body.setGravityY(0); // Phaser config gravity 사용
```

점프 변수:
```js
this.canDoubleJump = false;
this.hasDoubleJumped = false;
this.coyoteTimer = 0;
this.jumpBufferTimer = 0;
this.isOnGround = false;
this.gameStarted = false;
this.isDead = false;
this.trailTimer = 0;
this.rainbowTrail = false;
const COYOTE_MS = 150, BUFFER_MS = 120;
const JUMP_VY = -520, DJ_VY = -420;
```

Trail 색상:
```js
const TRAIL_COLORS = [0xFFD600, 0xF48FB1, 0x69F0AE, 0xFFFFFF, 0x90A4AE];
const RAINBOW = [0xFF0000,0xFF7F00,0xFFFF00,0x00FF00,0x0000FF,0x8B00FF];
```

doJump():
1. gameStarted=false → startGame() 호출 후 점프
2. isOnGround || coyoteTimer>0 → 일반점프 JUMP_VY, canDoubleJump=true
3. canDoubleJump && !hasDoubleJumped → 더블점프 DJ_VY, PAWS.doubleJumpCount++, 카메라shake(80, 0.004)
4. 그 외 → jumpBufferTimer=BUFFER_MS 예약
5. 각 경우 맞는 파티클/사운드 호출

update()에서:
- delta = this.game.loop.delta
- coyoteTimer>0 → coyoteTimer -= delta
- jumpBufferTimer>0 → jumpBufferTimer -= delta; 점프가능하면 즉시실행
- 캐릭터 회전: vy = bird.body.velocity.y; targetAngle = clamp(vy*0.06, -20, 70); bird.angle = lerp(bird.angle, targetAngle, 0.18)
- 최대 하강속도 clamp: if(bird.body.velocity.y > 620) bird.setVelocityY(620)
- trailTimer += delta; if(trailTimer>35) { spawnTrail(); trailTimer=0; }

spawnTrail():
- bird_N 이미지 x-12, y 위치에 생성
- scale 0.65, alpha 0.3
- tint: rainbowTrail ? RAINBOW[Math.floor(Date.now()/80)%6] : TRAIL_COLORS[skin]
- tween alpha→0, scale→0.2, duration 180, onComplete destroy

더블점프 파티클 spawnDJParticles():
- star_p 16개, 360도 방사, speed 60~130
- Shockwave ring: circle r=10 → scale 4, alpha 0→0, duration 350

더블점프 힌트:
- this.djHint = add.text(0, 0, '⭐⭐', ...).setDepth(11)
- update()에서 위치 bird.x, bird.y-36 따라다님
- canDoubleJump && !hasDoubleJumped 일 때만 visible

입력:
```js
this.input.keyboard.on('keydown-SPACE', () => this.doJump());
this.input.on('pointerdown', (p) => { if(p.y < 560) this.doJump(); });
```

완료: `git add games/flappy-paws/game.js && git commit -m "feat: flappy-paws STEP5 캐릭터+점프손맛" && git push`

---

## STEP 6 — 파이프 + 코인 + 충돌

GameScene에 파이프/코인 Object Pool + 충돌 판정 추가.

Object Pool 초기화 (create()):
```js
this.pipePool = [];
this.coinPool = [];
for(let i=0;i<6;i++){
  const top = this.physics.add.image(1200,0,'pipe_day').setDepth(5).setActive(false).setVisible(false);
  const bot = this.physics.add.image(1200,0,'pipe_day').setDepth(5).setActive(false).setVisible(false).setFlipY(true);
  top.body.allowGravity = false;
  bot.body.allowGravity = false;
  this.pipePool.push({top,bot,scored:false});
}
for(let i=0;i<6;i++){
  const c = this.physics.add.image(1200,0,'coin').setDepth(8).setActive(false).setVisible(false);
  c.body.allowGravity = false;
  this.coinPool.push(c);
}
this.lastGapY = 300;
this.nextPipeX = 500;
```

getDifficulty(score):
- speed: min(180 + score*2.8, 320)
- gap: max(165 - score*1.4, 110)
- spacing: max(3200 - score*20, 2000) // ms 기준

spawnPipe():
- prevGapY 기준 ±90 이내 랜덤 (절벽패턴 방지)
- clamp gapCenterY: 160~480
- 풀에서 비활성 pair 꺼내기
- top: y = gapCenterY - gap/2 - 200 (파이프 400px 기준 중심)
- bot: y = gapCenterY + gap/2 + 200
- setVelocityX(-speed), setActive(true), setVisible(true)
- 70% 확률로 spawnCoin(500, gapCenterY, speed)
- time.delayedCall(spacing, spawnPipe) // 재귀 타이머

spawnCoin(x, y, speed):
- 풀에서 비활성 코인 꺼내기
- setPosition, setVelocityX(-speed), setActive, setVisible
- bob tween: y±15, duration 400, yoyo repeat:-1

startGame():
- PAWS.score=0; PAWS.combo=0; PAWS.bestCombo=0;
- this.isDead = false
- time.delayedCall(1800, () => this.spawnPipe())

update()에 추가:
```js
// 파이프 풀 순회
this.pipePool.forEach(pair => {
  if(!pair.top.active) return;
  // 통과 점수
  if(!pair.scored && pair.top.x < this.bird.x - 30){
    pair.scored = true;
    this.addScore();
  }
  // 화면 밖 회수
  if(pair.top.x < -80){
    pair.top.setActive(false).setVisible(false);
    pair.bot.setActive(false).setVisible(false);
  }
  // AABB 충돌 (새 반지름 16px, 파이프 너비 60px)
  if(!this.isDead){
    const bx=this.bird.x, by=this.bird.y;
    [pair.top, pair.bot].forEach(pipe => {
      if(Math.abs(bx - pipe.x) < 46 && Math.abs(by - pipe.y) < 216) this.hitObstacle();
    });
  }
});

// 코인 수집
this.coinPool.forEach(coin => {
  if(!coin.active) return;
  if(Phaser.Math.Distance.Between(coin.x,coin.y,this.bird.x,this.bird.y) < 26){
    coin.setActive(false).setVisible(false);
    this.tweens.killTweensOf(coin);
    this.collectCoin();
  }
  if(coin.x < -40) coin.setActive(false).setVisible(false);
});

// 지면/천장
if(this.bird.y > 558 && !this.isDead) this.hitObstacle();
if(this.bird.y < 10) this.bird.setVelocityY(300);
```

addScore():
- PAWS.score++; PAWS.combo++; if(PAWS.combo>PAWS.bestCombo) PAWS.bestCombo=PAWS.combo;
- scoreText 업데이트
- 테마 전환 체크 (10/25/50점)
- 스킨 해금 체크 (10/25/50/100점) → showUnlockBanner()
- showComboEffect()
- passSound()

collectCoin():
- coinSound()
- 코인 획득 파티클 (star_p 6개 방사)
- 코인 수 UI 업데이트 (있다면)

완료: `git add games/flappy-paws/game.js && git commit -m "feat: flappy-paws STEP6 파이프+코인+충돌" && git push`

---

## STEP 7 — 콤보 + 카메라 연출 + WebAudio 사운드

GameScene에 추가.

showComboEffect() (PAWS.combo >= 3일 때):
- combo 3→'NICE!', 5→'COMBO!', 8→'GREAT!!', 10→'AMAZING!!!', 15→'LEGENDARY!!'
- 팝업 텍스트: x=240, y=160→130, alpha 0→1, Space Grotesk bold
  - combo<10: #FF6B6B, combo>=10: #FFD700
  - stroke #1A1D2E 두께 4
  - 600ms 유지 후 fadeout destroy
- combo>=5: showBorderGlow(combo>=10 ? 0xFF6B6B : 0xFFD700)
- combo===5: spawnStarBurst(240, 320) 별 20개 방사
- combo>=10: rainbowTrail=true, 3초 후 false

showBorderGlow(color):
- 480x640 Rectangle, fill 없음, stroke color lineWidth=6
- alpha 0.8→0 tween 800ms onComplete destroy

spawnStarBurst(x, y):
- star_p 이미지 20개, 360도 방사, speed 80~160
- 색상: [0xFFD700,0xFF6B6B,0x5B6BFF,0x69F0AE,0xFF6BA8] 순환
- tween: x/y 이동, alpha→0, scale→0.1, 700ms Cubic.Out, onComplete destroy

hitObstacle():
- isDead=true; PAWS.combo=0;
- cameras.main.shake(300, 0.018)
- physics.world.timeScale=4; time.timeScale=0.25; (슬로우모션)
- 300ms 후 timeScale 복구, showDeathEffect() 호출
- bird tween: angle+=720, y→700, duration 1200 Cubic.In
- deathSound(); navigator.vibrate?.(50);
- 1600ms 후 → checkNewRecord() → scene.start GameOverScene 데이터 전달

showDeathEffect():
- spawnStarBurst(bird.x, bird.y) 로 파티클
- 새 위치에 빨간 X 텍스트 잠깐 표시

checkNewRecord():
- score > bestScores[0] 이면:
  - 폭죽 5번 (200ms 간격, 랜덤 위치)
  - 'NEW RECORD! 🏆' 배너 y=280, tween 올라왔다 1.5초 유지 후 fadeout
  - return true
- return false

showUnlockBanner(skinKey):
- 하단에서 올라오는 배너 container
- '🎉 NEW SKIN!' + bird_N 이미지 32x32 + 스킨명
- 배경: #1A1D2E, 테두리 #FFD700
- y=700→570 tween, 2.5초 후 y=700 fadeout destroy

initSounds() — WebAudio API로 생성음:
```js
initSounds(){
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  const beep = (freq, type='sine', dur=0.12, vol=0.18, freqEnd=null) => {
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type; o.connect(g); g.connect(ctx.destination);
    o.frequency.value=freq;
    if(freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime+dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    o.start(); o.stop(ctx.currentTime+dur);
  };
  this.jumpSound      = () => beep(520,'sine',0.12,0.18,780);
  this.doubleJumpSound= () => { beep(780,'sine',0.13,0.2,1100); setTimeout(()=>beep(1000,'sine',0.1,0.15),60); };
  this.passSound      = () => beep(880,'triangle',0.12,0.12);
  this.coinSound      = () => beep(1200,'sine',0.1,0.1,1600);
  this.deathSound     = () => beep(400,'sawtooth',0.4,0.25,80);
  this.medalSound     = () => { [660,880,1100].forEach((f,i)=>setTimeout(()=>beep(f,'sine',0.25,0.15),i*100)); };
}
```

initSounds()는 첫 포인터down 또는 키입력 시 호출 (AudioContext 정책).

완료: `git add games/flappy-paws/game.js && git commit -m "feat: flappy-paws STEP7 콤보+카메라+사운드" && git push`

---

## STEP 8 — 인게임 UI + GameOverScene

**GameScene UI (depth 20):**

점수 텍스트:
- x=240, y=55, Space Grotesk 52px bold, 흰색, stroke #1A1D2E 두께5
- this.scoreText, setText(PAWS.score) in addScore()

Best 텍스트:
- x=455, y=18, Inter 13px, rgba(255,255,255,0.7) 우정렬

시작 전 안내:
- gameStarted=false일 때 "TAP TO START" x=240, y=320
- Space Grotesk 22px bold 흰색
- tween: y 310↔330 반복
- 첫 탭에 destroy

**GameOverScene:**

init(data): finalScore, isNewRecord, bestCombo 수신

create():
1. 배경: #F7F8FC Rectangle 전체
2. 도트 그리드 패턴 (옵션)
3. 메달 (getMedal(score)):
   - 메달 있으면 y=-50에서 y=130으로 tween + bounce (scale 1.3→1)
   - 이후 rotation tween 반복 (±8도)
   - medalSound()
   - 메달 없으면 😢 텍스트
4. 'GAME OVER' x=240, y=210, Space Grotesk 36px bold #1A1D2E
5. 스탯 카드 (x=240, y=300, 280x100, 흰 둥근rect radius=14, shadow):
   - Score: finalScore (크게, 신기록이면 🌟)
   - Best: bestScores[0]
   - Best Combo: x N
6. NEW RECORD 배너 (isNewRecord=true일 때만, y=390):
   - #FFD700 배경, '🏆 NEW RECORD!' 텍스트
   - scale 0→1 bounce tween
7. 버튼 2개 (y=450):
   - Menu (x=160): 테두리만 #5B6BFF, '🏠 Menu' → scene.start('SkinScene')
   - Retry (x=320): 채워진 #5B6BFF, '▶ Retry' → scene.start('GameScene')
   - 각 버튼 hover: scale 1.05
8. Top 5 기록 (y=530):
   - bestScores 최대 5개 표시
   - 현재 점수와 같은 항목 #5B6BFF 강조

getMedal(score):
- score>=50 → medal_platinum / 'PLATINUM'
- score>=30 → medal_gold / 'GOLD'
- score>=15 → medal_silver / 'SILVER'
- score>=5  → medal_bronze / 'BRONZE'
- 그 외 → null

GameScene → GameOver 전환 직전:
```js
const isNew = PAWS.score > (PAWS.bestScores[0]||0);
PAWS.bestScores.push(PAWS.score);
PAWS.bestScores.sort((a,b)=>b-a);
PAWS.bestScores = PAWS.bestScores.slice(0,5);
PAWS.totalGames++;
saveState();
this.scene.start('GameOverScene', {
  score: PAWS.score,
  isNewRecord: isNew,
  bestCombo: PAWS.bestCombo
});
```

완료: `git add games/flappy-paws/game.js && git commit -m "feat: flappy-paws STEP8 UI+게임오버씬" && git push`

---

## STEP 9 — 업적 + games.json + 최종점검

**업적 시스템 (GameScene에 추가):**

```js
const ACHIEVEMENTS = {
  first_play: { name:'첫 날개짓', icon:'🐣', req:()=>PAWS.totalGames>=1 },
  score_10:   { name:'하늘 입문', icon:'🌤', req:()=>(PAWS.bestScores[0]||0)>=10 },
  score_25:   { name:'별 사냥꾼', icon:'⭐', req:()=>(PAWS.bestScores[0]||0)>=25 },
  score_50:   { name:'우주비행사',icon:'🚀', req:()=>(PAWS.bestScores[0]||0)>=50 },
  score_100:  { name:'전설의 새', icon:'🏆', req:()=>(PAWS.bestScores[0]||0)>=100 },
  combo_10:   { name:'연속의 달인',icon:'🔥', req:()=>PAWS.bestCombo>=10 },
  dj_100:     { name:'더블마스터',icon:'💫', req:()=>PAWS.doubleJumpCount>=100 },
  play_10:    { name:'단골손님', icon:'🎮', req:()=>PAWS.totalGames>=10 },
};
```

checkAchievements() — addScore(), hitObstacle() 후 호출:
- 미달성 업적 req() 체크 → 달성시 PAWS.achievements[key]=true, saveState()
- showAchievementToast(ach) 호출

showAchievementToast(ach):
- 우하단 container (x=370, y=700→590)
- #1A1D2E 배경, #FFD700 테두리
- icon + '업적 달성!' + name
- 2초 유지 후 fadeout

**data/games.json 업데이트:**
flappy-paws 항목 추가 (manifest.json 내용 그대로).

**최종 점검 (실행 후 직접 확인):**
- http://localhost:8420/game/slug.html?id=flappy-paws 접속
- 스킨 선택 → PLAY → 스페이스/탭 점프 확인
- 더블점프 파티클 확인
- 파이프 통과 시 점수 증가 확인
- 10점 도달 → 저녁 테마 전환 확인
- 게임오버 → 메달/스탯 화면 확인
- Retry → 정상 재시작 확인
- 콘솔 에러 없음 확인

에러 있으면 즉시 수정.

완료: `git add . && git commit -m "feat: flappy-paws 최종완성 - 업적+games.json" && git push`
