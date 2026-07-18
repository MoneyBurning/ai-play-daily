(function () {
  const WIDTH = 600;
  const HEIGHT = 400;
  const CELL = 20;
  const COLS = WIDTH / CELL;
  const ROWS = HEIGHT / CELL;
  const SWIPE_THRESHOLD = 20;

  const BASE_MOVE_DELAY = 120;
  const MIN_MOVE_DELAY = 60;
  const DELAY_STEP = 10;
  const LEVEL_UP_SCORE = 50;

  const AI_ASSIST_MAX = 3;
  const AI_ASSIST_DURATION = 500;

  const SLOWMO_DURATION = 3000;
  const GOLDEN_SLOW_DURATION = 3000;

  const TIME_ORB_MIN_INTERVAL = 10000;
  const TIME_ORB_MAX_INTERVAL = 16000;
  const TIME_ORB_LIFESPAN = 6000;

  const FOOD_SCORES = { normal: 10, golden: 30, chip: 5 };

  const PORTAL_A = { x: 2, y: 2 };
  const PORTAL_B = { x: COLS - 3, y: ROWS - 3 };

  const HIGH_SCORE_KEY = 'aiplaydaily-snake-ai-highscore';

  const COLORS = {
    bg: 0x0a0616,
    glowPurple: 0x8b5cf6,
    glowCyan: 0x22d3ee,
    border: 0x8b5cf6,
    head: 0xd8ccff,
    headGlow: 0x8b5cf6,
    assistGlow: 0x22d3ee,
    eye: 0x7cf7ff,
    bodyStart: 0x8b5cf6,
    bodyEnd: 0x241246,
    foodNormal: 0xff6b6b,
    foodGolden: 0xffd23f,
    foodChip: 0x4fd7ff,
    timeOrb: 0x22d3ee,
    portalA: 0x8b5cf6,
    portalB: 0x22d3ee,
    text: '#E8E3FF',
    muted: '#8890A4',
    accent: '#FF6B6B'
  };

  let scene;
  let scoreText, highScoreText, levelText;
  let startOverlay, gameOverOverlay;
  let dpadButtons = [];
  let assistPips = [];
  let assistBarBg, assistBarFill;
  let eatEmitter;
  let headScanRing;
  let portalASprite, portalBSprite;

  let snakeSprites = [];
  let foodGlowOuter, foodGlowInner, foodCore, foodPulseTween;
  let orbGlow, orbCore, orbRing, orbPulseTween, orbRingTween;
  let slowmoTintRect, goldenFlashRect, levelFlashRect;

  let snake, direction, nextDirection, food, moveTimer;
  let timeOrb = null;
  let timeOrbSpawnEvent = null;
  let timeOrbExpireEvent = null;

  let score, highScore, level, slowStack, assistCharges, isAssisting;
  let state = 'ready'; // 'ready' | 'playing' | 'gameover'
  let touchStart = null;

  function loadHighScore() {
    try {
      return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveHighScore(value) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch (e) {
      /* localStorage unavailable, ignore */
    }
  }

  function create() {
    scene = this;

    createParticleTexture(this);
    buildBackground(this);
    buildPortals(this);
    buildOverlayRects(this);
    buildUI(this);
    buildAssistGauge(this);
    startOverlay = buildStartOverlay(this);
    gameOverOverlay = buildGameOverOverlay(this);
    buildDpad(this);

    headScanRing = this.add
      .arc(0, 0, CELL * 0.75, 0, 300, false, 0, 0)
      .setStrokeStyle(2, COLORS.headGlow, 0.8)
      .setDepth(1)
      .setVisible(false);
    this.tweens.add({
      targets: headScanRing,
      rotation: Math.PI * 2,
      duration: 1400,
      repeat: -1,
      ease: 'Linear'
    });

    eatEmitter = this.add
      .particles(0, 0, 'snake-particle', {
        speed: { min: 60, max: 170 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 450,
        tint: [COLORS.glowPurple, COLORS.glowCyan, 0xffffff],
        blendMode: 'ADD',
        emitting: false
      })
      .setDepth(2);

    setupInput(this);

    highScore = loadHighScore();
    highScoreText.setText('High: ' + highScore);

    prepareRound(true);
  }

  function createParticleTexture(sceneRef) {
    const g = sceneRef.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('snake-particle', 8, 8);
    g.destroy();
  }

  function buildBackground(sceneRef) {
    const bg = sceneRef.add.graphics();

    bg.fillStyle(COLORS.bg, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    bg.fillStyle(COLORS.glowPurple, 0.07);
    bg.fillCircle(80, 70, 220);
    bg.fillStyle(COLORS.glowCyan, 0.06);
    bg.fillCircle(WIDTH - 80, HEIGHT - 70,220);

    bg.lineStyle(1, COLORS.glowPurple, 0.07);
    for (let x = -HEIGHT; x < WIDTH; x += 40) {
      bg.lineBetween(x, 0, x + HEIGHT, HEIGHT);
    }

    bg.lineStyle(2, COLORS.border, 0.5);
    bg.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);
    bg.lineStyle(1, COLORS.glowCyan, 0.25);
    bg.strokeRect(7, 7, WIDTH - 14, HEIGHT - 14);
  }

  function buildOverlayRects(sceneRef) {
    slowmoTintRect = sceneRef.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.timeOrb, 0)
      .setDepth(500);
    goldenFlashRect = sceneRef.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xffe27a, 0)
      .setDepth(520);
    levelFlashRect = sceneRef.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xffffff, 0)
      .setDepth(540);
  }

  function buildPortal(sceneRef, pos, color) {
    const px = pos.x * CELL + CELL / 2;
    const py = pos.y * CELL + CELL / 2;

    const container = sceneRef.add.container(px, py);
    const glow = sceneRef.add.circle(0, 0, CELL * 0.9, color, 0.15);
    const ring = sceneRef.add
      .arc(0, 0, CELL * 0.6, 0, 270, false, 0, 0)
      .setStrokeStyle(3, color, 0.9);
    const core = sceneRef.add.circle(0, 0, CELL * 0.22, 0xffffff, 0.9);

    container.add([glow, ring, core]);

    sceneRef.tweens.add({
      targets: ring,
      rotation: Math.PI * 2,
      duration: 2200,
      repeat: -1,
      ease: 'Linear'
    });
    sceneRef.tweens.add({
      targets: core,
      scale: { from: 0.7, to: 1.2 },
      alpha: { from: 0.6, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    return container;
  }

  function buildPortals(sceneRef) {
    portalASprite = buildPortal(sceneRef, PORTAL_A, COLORS.portalA);
    portalBSprite = buildPortal(sceneRef, PORTAL_B, COLORS.portalB);
  }

  function portalFlash(pos) {
    const cx = pos.x * CELL + CELL / 2;
    const cy = pos.y * CELL + CELL / 2;
    const flash = scene.add.circle(cx, cy, CELL * 0.5, 0xffffff, 0.9).setDepth(3);
    scene.tweens.add({
      targets: flash,
      scale: 2.2,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  function isPortalCell(x, y) {
    if (x === PORTAL_A.x && y === PORTAL_A.y) return PORTAL_A;
    if (x === PORTAL_B.x && y === PORTAL_B.y) return PORTAL_B;
    return null;
  }

  function buildUI(sceneRef) {
    scoreText = sceneRef.add
      .text(12, 10, 'Score: 0', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: COLORS.text
      })
      .setDepth(600);

    levelText = sceneRef.add
      .text(WIDTH - 12, 10, 'Lv.1', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: COLORS.text
      })
      .setOrigin(1, 0)
      .setDepth(600);

    highScoreText = sceneRef.add
      .text(WIDTH / 2, 10, 'High: 0', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: COLORS.muted
      })
      .setOrigin(0.5, 0)
      .setDepth(600);
  }

  function buildAssistGauge(sceneRef) {
    const baseX = 14;
    const baseY = HEIGHT - 30;
    const size = 16;
    const gap = 22;

    const label = sceneRef.add
      .text(baseX - 2, baseY - 24, 'AI ASSIST', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        color: COLORS.muted
      })
      .setDepth(600);

    assistPips = [];
    for (let i = 0; i < AI_ASSIST_MAX; i++) {
      const pip = sceneRef.add
        .rectangle(baseX + i * gap, baseY, size, size, COLORS.assistGlow, 0.9)
        .setStrokeStyle(1, 0xffffff, 0.4)
        .setDepth(600);
      assistPips.push(pip);
    }

    const gaugeWidth = (AI_ASSIST_MAX - 1) * gap + size + 4;

    assistBarBg = sceneRef.add
      .rectangle(baseX - 2, baseY + 16, gaugeWidth, 6, 0xffffff, 0.08)
      .setOrigin(0, 0.5)
      .setDepth(600);
    assistBarFill = sceneRef.add
      .rectangle(baseX - 2, baseY + 16, gaugeWidth, 6, COLORS.assistGlow, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(600);
    assistBarFill.scaleX = 0;

    dpadButtons.push(label);
  }

  function updateAssistGaugeUI() {
    assistPips.forEach((pip, i) => {
      if (i < assistCharges) {
        pip.setFillStyle(COLORS.assistGlow, 0.9);
      } else {
        pip.setFillStyle(0x2a2e45, 0.6);
      }
    });
  }

  function buildStartOverlay(sceneRef) {
    const c = sceneRef.add.container(WIDTH / 2, HEIGHT / 2).setDepth(700);

    const backdrop = sceneRef.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg, 0.88);
    const title = sceneRef.add
      .text(0, -46, 'SNAKE AI', {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#D8CCFF'
      })
      .setOrigin(0.5);
    const subtitle = sceneRef.add
      .text(0, 0, 'Click / Tap / Enter to Start', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: COLORS.text
      })
      .setOrigin(0.5);
    const hint1 = sceneRef.add
      .text(0, 26, 'SPACE = AI 어시스트 (최단경로 자동주행, 3회)', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: COLORS.muted
      })
      .setOrigin(0.5);
    const hint2 = sceneRef.add
      .text(0, 46, '🔴 사과 +10   🟡 황금사과 +30(감속)   🔵 AI칩 +어시스트', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: COLORS.muted
      })
      .setOrigin(0.5);

    c.add([backdrop, title, subtitle, hint1, hint2]);
    return c;
  }

  function buildGameOverOverlay(sceneRef) {
    const c = sceneRef.add.container(WIDTH / 2, HEIGHT / 2).setDepth(700).setVisible(false);

    const backdrop = sceneRef.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg, 0.88);
    const title = sceneRef.add
      .text(0, -40, 'GAME OVER', {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: COLORS.accent
      })
      .setOrigin(0.5);
    const statsText = sceneRef.add
      .text(0, 6, '', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: COLORS.text,
        align: 'center'
      })
      .setOrigin(0.5);
    const restartText = sceneRef.add
      .text(0, 38, 'Click / Tap / Enter to restart', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: COLORS.muted
      })
      .setOrigin(0.5);

    c.add([backdrop, title, statsText, restartText]);
    c.statsText = statsText;
    return c;
  }

  function buildDpad(sceneRef) {
    const cx = WIDTH - 66;
    const cy = HEIGHT - 66;
    const gap = 32;
    const radius = 22;

    const defs = [
      { dx: 0, dy: -gap, label: '▲', vx: 0, vy: -1 },
      { dx: 0, dy: gap, label: '▼', vx: 0, vy: 1 },
      { dx: -gap, dy: 0, label: '◀', vx: -1, vy: 0 },
      { dx: gap, dy: 0, label: '▶', vx: 1, vy: 0 }
    ];

    defs.forEach((d) => {
      const bx = cx + d.dx;
      const by = cy + d.dy;

      const circle = sceneRef.add
        .circle(bx, by, radius, COLORS.glowPurple, 0.28)
        .setStrokeStyle(1, COLORS.glowCyan, 0.6)
        .setDepth(600);
      const label = sceneRef.add
        .text(bx, by, d.label, { fontSize: '14px', color: '#EEF0FF' })
        .setOrigin(0.5)
        .setDepth(600);

      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerdown', () => {
        if (state === 'playing') setDirection(d.vx, d.vy);
      });
      circle.on('pointerover', () => circle.setFillStyle(COLORS.glowPurple, 0.5));
      circle.on('pointerout', () => circle.setFillStyle(COLORS.glowPurple, 0.28));

      dpadButtons.push(circle, label);
    });

    setDpadVisible(false);
  }

  function setDpadVisible(visible) {
    dpadButtons.forEach((o) => o.setVisible(visible));
  }

  function resetSlowEffects() {
    slowStack = 0;
    scene.tweens.killTweensOf(slowmoTintRect);
    slowmoTintRect.setAlpha(0);
    scene.tweens.killTweensOf(goldenFlashRect);
    goldenFlashRect.setAlpha(0);
  }

  function updateMoveDelay() {
    const levelDelay = Math.max(MIN_MOVE_DELAY, BASE_MOVE_DELAY - (level - 1) * DELAY_STEP);
    const effective = slowStack > 0 ? levelDelay * 2 : levelDelay;
    restartMoveTimer(effective);
  }

  function applyTemporarySlow(duration) {
    slowStack++;
    updateMoveDelay();
    scene.time.delayedCall(duration, () => {
      slowStack = Math.max(0, slowStack - 1);
      updateMoveDelay();
    });
  }

  function triggerSlowmoTint() {
    scene.tweens.killTweensOf(slowmoTintRect);
    slowmoTintRect.setAlpha(0);
    scene.tweens.add({
      targets: slowmoTintRect,
      alpha: 0.16,
      duration: 200,
      onComplete: () => {
        scene.time.delayedCall(Math.max(0, SLOWMO_DURATION - 400), () => {
          scene.tweens.add({ targets: slowmoTintRect, alpha: 0, duration: 200 });
        });
      }
    });
  }

  function triggerGoldenFlash() {
    scene.tweens.killTweensOf(goldenFlashRect);
    goldenFlashRect.setAlpha(0.3);
    scene.tweens.add({ targets: goldenFlashRect, alpha: 0, duration: 350, ease: 'Cubic.easeOut' });
  }

  function triggerLevelFlash() {
    scene.tweens.killTweensOf(levelFlashRect);
    levelFlashRect.setAlpha(0.55);
    scene.tweens.add({ targets: levelFlashRect, alpha: 0, duration: 350, ease: 'Cubic.easeOut' });
  }

  function prepareRound(showStart) {
    clearSnakeSprites();
    destroyFoodSprites();
    destroyTimeOrbSprites();

    if (timeOrbSpawnEvent) {
      timeOrbSpawnEvent.remove();
      timeOrbSpawnEvent = null;
    }
    if (timeOrbExpireEvent) {
      timeOrbExpireEvent.remove();
      timeOrbExpireEvent = null;
    }
    timeOrb = null;

    resetSlowEffects();

    snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    level = 1;
    assistCharges = AI_ASSIST_MAX;
    isAssisting = false;

    scoreText.setText('Score: 0');
    levelText.setText('Lv.1');
    updateAssistGaugeUI();
    assistBarFill.scaleX = 0;
    headScanRing.setStrokeStyle(2, COLORS.headGlow, 0.8);
    headScanRing.setVisible(false);

    spawnFood();
    renderSnake();
    renderFood();

    gameOverOverlay.setVisible(false);
    setDpadVisible(false);

    if (showStart) {
      state = 'ready';
      startOverlay.setVisible(true);
    }
  }

  function beginPlaying() {
    state = 'playing';
    startOverlay.setVisible(false);
    gameOverOverlay.setVisible(false);
    setDpadVisible(true);
    headScanRing.setVisible(true);
    restartMoveTimer(BASE_MOVE_DELAY);
    scheduleTimeOrb();
  }

  function restartMoveTimer(delay) {
    if (moveTimer) moveTimer.remove();
    moveTimer = scene.time.addEvent({ delay, callback: moveSnake, loop: true });
  }

  function isCellFree(x, y) {
    if (snake.some((s) => s.x === x && s.y === y)) return false;
    if ((x === PORTAL_A.x && y === PORTAL_A.y) || (x === PORTAL_B.x && y === PORTAL_B.y)) return false;
    if (timeOrb && timeOrb.x === x && timeOrb.y === y) return false;
    if (food && food.x === x && food.y === y) return false;
    return true;
  }

  function randomFreeCell() {
    let pos;
    do {
      pos = { x: Phaser.Math.Between(0, COLS - 1), y: Phaser.Math.Between(0, ROWS - 1) };
    } while (!isCellFree(pos.x, pos.y));
    return pos;
  }

  function pickFoodType() {
    const r = Math.random();
    if (r < 0.62) return 'normal';
    if (r < 0.85) return 'golden';
    return 'chip';
  }

  function spawnFood() {
    food = null;
    const pos = randomFreeCell();
    food = { x: pos.x, y: pos.y, type: pickFoodType() };
  }

  function scheduleTimeOrb() {
    const delay = Phaser.Math.Between(TIME_ORB_MIN_INTERVAL, TIME_ORB_MAX_INTERVAL);
    timeOrbSpawnEvent = scene.time.delayedCall(delay, spawnTimeOrb);
  }

  function spawnTimeOrb() {
    if (state !== 'playing') return;
    const pos = randomFreeCell();
    timeOrb = { x: pos.x, y: pos.y };
    renderTimeOrb();

    timeOrbExpireEvent = scene.time.delayedCall(TIME_ORB_LIFESPAN, () => {
      if (timeOrb) {
        destroyTimeOrbSprites();
        timeOrb = null;
        scheduleTimeOrb();
      }
    });
  }

  function moveSnake() {
    if (state !== 'playing') return;

    if (isAssisting) {
      const aiDir = computeAiDirection();
      if (aiDir) nextDirection = aiDir;
    }
    direction = nextDirection;

    const head = snake[0];
    let newHead = { x: head.x + direction.x, y: head.y + direction.y };

    const hitsWall = newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
    const hitsSelf = snake.some((s) => s.x === newHead.x && s.y === newHead.y);

    if (hitsWall || hitsSelf) {
      triggerGameOver();
      return;
    }

    const portal = isPortalCell(newHead.x, newHead.y);
    if (portal) {
      const other = portal === PORTAL_A ? PORTAL_B : PORTAL_A;
      portalFlash(portal);
      portalFlash(other);
      newHead = { x: other.x, y: other.y };
    }

    snake.unshift(newHead);

    let grew = false;
    if (food && newHead.x === food.x && newHead.y === food.y) {
      handleEat();
      grew = true;
    }
    if (timeOrb && newHead.x === timeOrb.x && newHead.y === timeOrb.y) {
      handleTimeOrbEat();
    }
    if (!grew) snake.pop();

    renderSnake();
  }

  function handleEat() {
    const type = food.type;
    const gained = FOOD_SCORES[type];
    score += gained;
    scoreText.setText('Score: ' + score);

    if (score > highScore) {
      highScore = score;
      highScoreText.setText('High: ' + highScore);
      saveHighScore(highScore);
    }

    const px = food.x * CELL + CELL / 2;
    const py = food.y * CELL + CELL / 2;
    const popupColor = type === 'golden' ? '#FFD23F' : type === 'chip' ? '#4FD7FF' : '#FFFFFF';
    spawnScorePopup(px, py - 10, '+' + gained, popupColor);
    eatEmitter.explode(16, px, py);

    if (type === 'golden') {
      triggerGoldenFlash();
      applyTemporarySlow(GOLDEN_SLOW_DURATION);
    } else if (type === 'chip') {
      if (assistCharges < AI_ASSIST_MAX) {
        assistCharges++;
        updateAssistGaugeUI();
        spawnScorePopup(px, py + 16, 'AI +1', '#4FD7FF');
      }
    }

    updateLevel();
    spawnFood();
    renderFood();
  }

  function handleTimeOrbEat() {
    const px = timeOrb.x * CELL + CELL / 2;
    const py = timeOrb.y * CELL + CELL / 2;

    if (timeOrbExpireEvent) {
      timeOrbExpireEvent.remove();
      timeOrbExpireEvent = null;
    }
    destroyTimeOrbSprites();
    timeOrb = null;

    spawnScorePopup(px, py - 10, 'SLOW-MO!', '#4FD7FF');
    eatEmitter.explode(20, px, py);
    triggerSlowmoTint();
    applyTemporarySlow(SLOWMO_DURATION);

    scheduleTimeOrb();
  }

  function updateLevel() {
    const newLevel = 1 + Math.floor(score / LEVEL_UP_SCORE);
    if (newLevel > level) {
      level = newLevel;
      levelText.setText('Lv.' + level);
      triggerLevelFlash();
      spawnScorePopup(WIDTH / 2, 70, 'LEVEL UP!', '#B98BFF');
      updateMoveDelay();
    }
  }

  function spawnScorePopup(x, y, text, color) {
    const t = scene.add
      .text(x, y, text, {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: color || '#FFFFFF'
      })
      .setOrigin(0.5)
      .setDepth(510);

    scene.tweens.add({
      targets: t,
      y: y - 30,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy()
    });
  }

  function triggerGameOver() {
    state = 'gameover';
    if (moveTimer) moveTimer.remove();
    setDpadVisible(false);
    headScanRing.setVisible(false);
    isAssisting = false;

    if (timeOrbSpawnEvent) {
      timeOrbSpawnEvent.remove();
      timeOrbSpawnEvent = null;
    }
    if (timeOrbExpireEvent) {
      timeOrbExpireEvent.remove();
      timeOrbExpireEvent = null;
    }
    destroyTimeOrbSprites();
    timeOrb = null;
    resetSlowEffects();

    gameOverAnimation();
    scene.time.delayedCall(900, showGameOverOverlay);
  }

  function gameOverAnimation() {
    const sprites = snakeSprites.slice();
    sprites.forEach((sprite, i) => {
      scene.time.delayedCall(i * 18, () => {
        if (!sprite.active) return;
        scene.tweens.add({
          targets: sprite,
          x: sprite.x + Phaser.Math.Between(-6, 6),
          y: sprite.y + Phaser.Math.Between(-6, 6),
          duration: 55,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            scene.tweens.add({
              targets: sprite,
              alpha: 0,
              scale: 0.3,
              duration: 280,
              onComplete: () => sprite.destroy()
            });
          }
        });
      });
    });
    snakeSprites = [];
  }

  function showGameOverOverlay() {
    gameOverOverlay.statsText.setText('Score: ' + score + '   High: ' + highScore);
    gameOverOverlay.setVisible(true);
  }

  function clearSnakeSprites() {
    snakeSprites.forEach((s) => s.destroy());
    snakeSprites = [];
  }

  function renderSnake() {
    clearSnakeSprites();

    const n = snake.length;
    snake.forEach((seg, i) => {
      const cx = seg.x * CELL + CELL / 2;
      const cy = seg.y * CELL + CELL / 2;

      if (i === 0) {
        const glow = scene.add.circle(cx, cy, CELL * 0.85, COLORS.headGlow, 0.25);
        const head = scene.add.circle(cx, cy, CELL / 2 - 1, COLORS.head);

        const perpX = -direction.y;
        const perpY = direction.x;
        const fwd = CELL * 0.12;
        const off = CELL * 0.16;
        const eye1 = scene.add.circle(
          cx + direction.x * fwd + perpX * off,
          cy + direction.y * fwd + perpY * off,
          2.2,
          COLORS.eye
        );
        const eye2 = scene.add.circle(
          cx + direction.x * fwd - perpX * off,
          cy + direction.y * fwd - perpY * off,
          2.2,
          COLORS.eye
        );

        snakeSprites.push(glow, head, eye1, eye2);
        headScanRing.setPosition(cx, cy);
        headScanRing.setVisible(state === 'playing');
      } else {
        const t = (i - 1) / Math.max(1, n - 2);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(COLORS.bodyStart),
          Phaser.Display.Color.ValueToColor(COLORS.bodyEnd),
          100,
          Math.floor(t * 100)
        );
        const colorInt = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
        const isTail = i === n - 1;
        const radius = (CELL / 2 - 1) * (isTail ? 0.7 : 1);

        const segment = scene.add.circle(cx, cy, radius, colorInt);
        snakeSprites.push(segment);
      }
    });
  }

  function destroyFoodSprites() {
    if (foodPulseTween) foodPulseTween.stop();
    [foodGlowOuter, foodGlowInner, foodCore].forEach((o) => {
      if (o) o.destroy();
    });
    foodGlowOuter = foodGlowInner = foodCore = null;
  }

  function renderFood() {
    destroyFoodSprites();
    if (!food) return;

    const cx = food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2;
    const type = food.type;

    const palette = {
      normal: { glow: COLORS.foodNormal, core: 0xffb3b3 },
      golden: { glow: COLORS.foodGolden, core: 0xfff3b0 },
      chip: { glow: COLORS.foodChip, core: 0xbfe9ff }
    }[type];

    foodGlowOuter = scene.add.circle(cx, cy, CELL * 0.9, palette.glow, 0.15);
    foodGlowInner = scene.add.circle(cx, cy, CELL * 0.55, palette.glow, 0.35);

    if (type === 'chip') {
      foodCore = scene.add
        .rectangle(cx, cy, CELL * 0.5, CELL * 0.5, palette.core)
        .setRotation(Math.PI / 4);
    } else {
      foodCore = scene.add.circle(cx, cy, type === 'golden' ? CELL * 0.32 : CELL * 0.28, palette.core);
    }

    foodPulseTween = scene.tweens.add({
      targets: [foodGlowOuter, foodGlowInner],
      scale: { from: 1, to: type === 'golden' ? 1.6 : 1.4 },
      alpha: { from: 0.35, to: 0.05 },
      duration: type === 'golden' ? 550 : 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  function destroyTimeOrbSprites() {
    if (orbPulseTween) orbPulseTween.stop();
    if (orbRingTween) orbRingTween.stop();
    [orbGlow, orbCore, orbRing].forEach((o) => {
      if (o) o.destroy();
    });
    orbGlow = orbCore = orbRing = null;
  }

  function renderTimeOrb() {
    destroyTimeOrbSprites();
    if (!timeOrb) return;

    const cx = timeOrb.x * CELL + CELL / 2;
    const cy = timeOrb.y * CELL + CELL / 2;

    orbGlow = scene.add.circle(cx, cy, CELL * 0.95, COLORS.timeOrb, 0.18);
    orbCore = scene.add.circle(cx, cy, CELL * 0.3, 0xe0f7ff, 0.95);
    orbRing = scene.add
      .arc(cx, cy, CELL * 0.55, 0, 300, false, 0, 0)
      .setStrokeStyle(2, COLORS.timeOrb, 0.9);

    orbPulseTween = scene.tweens.add({
      targets: orbGlow,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.3, to: 0.05 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    orbRingTween = scene.tweens.add({
      targets: orbRing,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  function bfsNextStep(startX, startY, targetX, targetY, obstacles) {
    const key = (x, y) => x + ',' + y;
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    const visited = new Set([key(startX, startY)]);
    const queue = [{ x: startX, y: startY, path: [] }];

    while (queue.length) {
      const cur = queue.shift();
      if (cur.x === targetX && cur.y === targetY) {
        return cur.path[0] || null;
      }
      for (const d of dirs) {
        const nx = cur.x + d.x;
        const ny = cur.y + d.y;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        const k = key(nx, ny);
        if (visited.has(k) || obstacles.has(k)) continue;
        visited.add(k);
        queue.push({ x: nx, y: ny, path: cur.path.concat([d]) });
      }
    }
    return null;
  }

  function computeAiDirection() {
    if (!food) return null;
    const head = snake[0];
    const obstacles = new Set(snake.map((s) => s.x + ',' + s.y));
    return bfsNextStep(head.x, head.y, food.x, food.y, obstacles);
  }

  function triggerAiAssist() {
    if (state !== 'playing' || isAssisting || assistCharges <= 0) return;

    assistCharges--;
    updateAssistGaugeUI();
    isAssisting = true;

    assistBarFill.scaleX = 1;
    scene.tweens.add({ targets: assistBarFill, scaleX: 0, duration: AI_ASSIST_DURATION, ease: 'Linear' });
    headScanRing.setStrokeStyle(3, 0xffffff, 1);

    scene.time.delayedCall(AI_ASSIST_DURATION, () => {
      isAssisting = false;
      headScanRing.setStrokeStyle(2, COLORS.headGlow, 0.8);
    });
  }

  function setDirection(x, y) {
    if (state !== 'playing') return;
    if (direction.x === -x && direction.y === -y) return;
    if (direction.x === x && direction.y === y) return;
    nextDirection = { x, y };
  }

  function handleStartOrRestart() {
    if (state === 'ready') {
      beginPlaying();
    } else if (state === 'gameover') {
      prepareRound(false);
      beginPlaying();
    }
  }

  function setupInput(sceneRef) {
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

    sceneRef.input.keyboard.addCapture([
      KeyCodes.UP,
      KeyCodes.DOWN,
      KeyCodes.LEFT,
      KeyCodes.RIGHT,
      KeyCodes.SPACE,
      KeyCodes.ENTER,
      KeyCodes.W,
      KeyCodes.A,
      KeyCodes.S,
      KeyCodes.D
    ]);

    sceneRef.input.keyboard.on('keydown', (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          setDirection(0, -1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setDirection(0, 1);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setDirection(-1, 0);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setDirection(1, 0);
          break;
        case 'Space':
          if (state === 'playing') triggerAiAssist();
          break;
        case 'Enter':
          handleStartOrRestart();
          break;
      }
    });

    sceneRef.input.on('pointerdown', (pointer) => {
      touchStart = { x: pointer.x, y: pointer.y };
    });

    sceneRef.input.on('pointerup', (pointer) => {
      if (!touchStart) return;

      const dx = pointer.x - touchStart.x;
      const dy = pointer.y - touchStart.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) {
        handleStartOrRestart();
        touchStart = null;
        return;
      }

      if (state === 'playing') {
        if (absDx > absDy) {
          setDirection(dx > 0 ? 1 : -1, 0);
        } else {
          setDirection(0, dy > 0 ? 1 : -1);
        }
      }

      touchStart = null;
    });
  }

  const parentEl = document.querySelector('.game-stage') || 'game-container';

  const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: parentEl,
    backgroundColor: '#0A0616',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
      create,
      update: function () {}
    }
  };

  new Phaser.Game(config);
})();
