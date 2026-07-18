(function () {
  const WIDTH = 480;
  const HEIGHT = 660;
  const CARD = 105;
  const GAP = 10;
  const GRID_TOP_BASE = 64;
  const BOTTOM_MARGIN = 20;
  const FLIP_DURATION = 120;
  const PEEK_REVEAL_DURATION = 3000;

  const BASE_PAIR_SCORE = 100;
  const COMBO_CAP = 4;
  const TIME_BONUS_PER_SEC = 5;

  const GHOST_BASE_ALPHA = 0.1;
  const GHOST_DECAY = 0.025;
  const GHOST_MIN = 0.02;

  const SYMBOLS = ['🍎', '🍌', '🍇', '🍉', '🍒', '🍋', '🥝', '🍓'];

  const DIFFICULTIES = {
    easy: { key: 'easy', label: 'EASY', cols: 3, rows: 4, pairs: 6, timeLimit: 0 },
    normal: { key: 'normal', label: 'NORMAL', cols: 4, rows: 4, pairs: 8, timeLimit: 0 },
    hard: { key: 'hard', label: 'HARD', cols: 4, rows: 5, pairs: 10, timeLimit: 60 }
  };

  const HIGH_SCORE_KEY = 'aiplaydaily-memory-match-highscores';

  const COLORS = {
    bg: 0xf7f8fc,
    surface: 0xffffff,
    primary: 0x5b6bff,
    primaryStr: '#5B6BFF',
    accent: 0xff6b6b,
    accentStr: '#FF6B6B',
    tagBg: 0xeef0ff,
    text: '#1A1D2E',
    muted: '#8890A4',
    gold: 0xffc542,
    goldStr: '#E8A400',
    matched: 0x22c1a0,
    matchedStr: '#1FA98A'
  };

  let scene;
  let highScores = {};

  let currentDifficulty = null;
  let gridOffsets = null;

  let cards = [];
  let flippedIndices = [];
  let isAnimating = false;
  let isPeeking = false;

  let cursorIndex = 0;
  let selectCursor = 1;

  let moves = 0;
  let score = 0;
  let comboCount = 0;
  let matchedPairs = 0;

  let remainingTime = 0;
  let elapsedSeconds = 0;
  let countdownEvent = null;
  let stopwatchEvent = null;

  let state = 'select'; // 'select' | 'playing' | 'result'

  let scoreText, highScoreText, timerText, movesText, diffLabelText, comboText;
  let selectOverlay, selectCards = [];
  let resultOverlay, resultTitle, resultStats;
  let cursorHighlight, comboGlowBorder;

  function loadHighScores() {
    try {
      const raw = localStorage.getItem(HIGH_SCORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveHighScores() {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScores));
    } catch (e) {
      /* localStorage unavailable, ignore */
    }
  }

  function getHighScore(key) {
    return highScores[key] || 0;
  }

  function setHighScore(key, value) {
    highScores[key] = value;
    saveHighScores();
  }

  function create() {
    scene = this;
    highScores = loadHighScores();

    buildBackground(this);
    buildHUD(this);
    comboGlowBorder = buildComboGlow(this);

    cursorHighlight = this.add
      .rectangle(0, 0, CARD + 8, CARD + 8)
      .setStrokeStyle(3, COLORS.accent, 1)
      .setFillStyle()
      .setVisible(false)
      .setDepth(400);

    selectOverlay = buildSelectScreen(this);
    resultOverlay = buildResultOverlay(this);

    setupInput(this);
    updateSelectBest();
    updateSelectHighlight();

    state = 'select';
  }

  function buildBackground(sceneRef) {
    sceneRef.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.bg, 1);
  }

  function buildComboGlow(sceneRef) {
    const g = sceneRef.add.graphics().setDepth(550);
    g.lineStyle(10, COLORS.gold, 0.5);
    g.strokeRect(5, 5, WIDTH - 10, HEIGHT - 10);
    g.lineStyle(4, COLORS.gold, 0.9);
    g.strokeRect(5, 5, WIDTH - 10, HEIGHT - 10);
    g.setAlpha(0);
    return g;
  }

  function buildHUD(sceneRef) {
    scoreText = sceneRef.add
      .text(12, 10, 'Score: 0', { fontFamily: 'Inter, sans-serif', fontSize: '15px', color: COLORS.text })
      .setDepth(600);
    highScoreText = sceneRef.add
      .text(WIDTH / 2, 10, 'High: 0', { fontFamily: 'Inter, sans-serif', fontSize: '15px', color: COLORS.muted })
      .setOrigin(0.5, 0)
      .setDepth(600);
    timerText = sceneRef.add
      .text(WIDTH - 12, 10, 'Time: 0s', { fontFamily: 'Inter, sans-serif', fontSize: '15px', color: COLORS.text })
      .setOrigin(1, 0)
      .setDepth(600);

    movesText = sceneRef.add
      .text(12, 34, 'Moves: 0', { fontFamily: 'Inter, sans-serif', fontSize: '13px', color: COLORS.muted })
      .setDepth(600);
    diffLabelText = sceneRef.add
      .text(WIDTH - 12, 34, '', { fontFamily: 'Inter, sans-serif', fontSize: '12px', color: COLORS.muted })
      .setOrigin(1, 0)
      .setDepth(600);
    comboText = sceneRef.add
      .text(WIDTH / 2, 34, '', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: COLORS.goldStr
      })
      .setOrigin(0.5, 0)
      .setDepth(600)
      .setVisible(false);
  }

  function buildSelectScreen(sceneRef) {
    const c = sceneRef.add.container(0, 0).setDepth(700);

    const backdrop = sceneRef.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.bg, 1);
    const title = sceneRef.add
      .text(WIDTH / 2, 70, 'MEMORY MATCH', {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: COLORS.text
      })
      .setOrigin(0.5);
    const subtitle = sceneRef.add
      .text(WIDTH / 2, 104, '난이도를 선택하세요', { fontFamily: 'Inter, sans-serif', fontSize: '14px', color: COLORS.muted })
      .setOrigin(0.5);

    c.add([backdrop, title, subtitle]);

    const defs = [DIFFICULTIES.easy, DIFFICULTIES.normal, DIFFICULTIES.hard];
    const cardW = 130;
    const cardH = 220;
    const gap = 18;
    const totalW = defs.length * cardW + (defs.length - 1) * gap;
    const startX = (WIDTH - totalW) / 2 + cardW / 2;
    const cy = HEIGHT / 2 + 30;

    selectCards = [];
    defs.forEach((d, i) => {
      const cx = startX + i * (cardW + gap);

      const cardBg = sceneRef.add
        .rectangle(cx, cy, cardW, cardH, COLORS.surface)
        .setStrokeStyle(2, COLORS.primary, 0.5);
      const label = sceneRef.add
        .text(cx, cy - cardH / 2 + 30, d.label, {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: COLORS.text
        })
        .setOrigin(0.5);
      const dims = sceneRef.add
        .text(cx, cy - 8, `${d.cols}×${d.rows}`, { fontFamily: 'Inter, sans-serif', fontSize: '24px', color: COLORS.primaryStr })
        .setOrigin(0.5);
      const pairs = sceneRef.add
        .text(cx, cy + 22, `${d.pairs}쌍`, { fontFamily: 'Inter, sans-serif', fontSize: '13px', color: COLORS.muted })
        .setOrigin(0.5);
      const timeTag = d.timeLimit
        ? sceneRef.add
            .text(cx, cy + 46, `⏱ ${d.timeLimit}초 제한`, { fontFamily: 'Inter, sans-serif', fontSize: '12px', color: COLORS.accentStr })
            .setOrigin(0.5)
        : sceneRef.add
            .text(cx, cy + 46, '제한시간 없음', { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: COLORS.muted })
            .setOrigin(0.5);
      const bestText = sceneRef.add
        .text(cx, cy + cardH / 2 - 18, 'Best: 0', { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: COLORS.muted })
        .setOrigin(0.5);

      cardBg.setInteractive({ useHandCursor: true });
      cardBg.on('pointerdown', () => {
        selectCursor = i;
        chooseDifficulty(d.key);
      });
      cardBg.on('pointerover', () => {
        if (state === 'select') cardBg.setStrokeStyle(3, COLORS.primary, 1);
      });
      cardBg.on('pointerout', () => {
        if (state === 'select') cardBg.setStrokeStyle(i === selectCursor ? 3 : 2, COLORS.primary, i === selectCursor ? 1 : 0.5);
      });

      c.add([cardBg, label, dims, pairs, timeTag, bestText]);
      selectCards.push({ key: d.key, bg: cardBg, bestText });
    });

    const hint = sceneRef.add
      .text(WIDTH / 2, HEIGHT - 30, '카드를 클릭하거나 방향키+Enter로 시작하세요', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: COLORS.muted
      })
      .setOrigin(0.5);
    c.add(hint);

    return c;
  }

  function updateSelectBest() {
    selectCards.forEach((sc) => sc.bestText.setText('Best: ' + getHighScore(sc.key)));
  }

  function updateSelectHighlight() {
    selectCards.forEach((sc, i) => {
      sc.bg.setStrokeStyle(i === selectCursor ? 3 : 2, COLORS.primary, i === selectCursor ? 1 : 0.5);
    });
  }

  function moveSelectCursor(delta) {
    selectCursor = Phaser.Math.Clamp(selectCursor + delta, 0, selectCards.length - 1);
    updateSelectHighlight();
  }

  function buildResultOverlay(sceneRef) {
    const c = sceneRef.add.container(WIDTH / 2, HEIGHT / 2).setDepth(700).setVisible(false);

    const backdrop = sceneRef.add
      .rectangle(0, 0, WIDTH, HEIGHT, COLORS.surface, 0.94)
      .setInteractive();
    backdrop.on('pointerdown', () => {
      if (state === 'result') returnToSelect();
    });

    resultTitle = sceneRef.add
      .text(0, -60, 'CLEAR!', {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        color: COLORS.matchedStr
      })
      .setOrigin(0.5);
    resultStats = sceneRef.add
      .text(0, 0, '', { fontFamily: 'Inter, sans-serif', fontSize: '16px', color: COLORS.text, align: 'center' })
      .setOrigin(0.5);
    const hint = sceneRef.add
      .text(0, 80, 'Click / Tap / Enter로 난이도 선택 화면으로', { fontFamily: 'Inter, sans-serif', fontSize: '13px', color: COLORS.muted })
      .setOrigin(0.5);

    c.add([backdrop, resultTitle, resultStats, hint]);
    return c;
  }

  function computeGridOffsets(cols, rows) {
    const gridWidth = cols * (CARD + GAP) - GAP;
    const gridHeight = rows * (CARD + GAP) - GAP;
    const availableHeight = HEIGHT - GRID_TOP_BASE - BOTTOM_MARGIN;

    return {
      left: (WIDTH - gridWidth) / 2,
      top: GRID_TOP_BASE + Math.max(0, (availableHeight - gridHeight) / 2)
    };
  }

  function cardPosition(index, cols, offsets) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      x: offsets.left + CARD / 2 + col * (CARD + GAP),
      y: offsets.top + CARD / 2 + row * (CARD + GAP)
    };
  }

  function displayGlyph(value) {
    if (value === 'wild') return '⚡';
    if (value === 'peek') return '🔍';
    return value;
  }

  function buildDeck(pairs) {
    const normalCount = pairs - 2;
    const chosenSymbols = Phaser.Utils.Array.Shuffle(SYMBOLS.slice()).slice(0, normalCount);

    const values = [];
    chosenSymbols.forEach((s) => values.push(s, s));
    values.push('wild', 'wild');
    values.push('peek', 'peek');

    return Phaser.Utils.Array.Shuffle(values);
  }

  function chooseDifficulty(key) {
    currentDifficulty = DIFFICULTIES[key];
    selectOverlay.setVisible(false);
    startRound();
  }

  function createCard(value, index) {
    const pos = cardPosition(index, currentDifficulty.cols, gridOffsets);
    const container = scene.add.container(pos.x, pos.y);
    const isSpecial = value === 'wild' || value === 'peek';

    const backRect = scene.add
      .rectangle(0, 0, CARD, CARD, COLORS.surface)
      .setStrokeStyle(isSpecial ? 3 : 2, isSpecial ? COLORS.gold : COLORS.primary, isSpecial ? 1 : 0.6);
    const backText = scene.add
      .text(0, 0, '?', { fontFamily: '"Space Grotesk", sans-serif', fontSize: '30px', color: COLORS.primaryStr })
      .setOrigin(0.5);
    const ghostText = scene.add.text(0, 0, displayGlyph(value), { fontSize: '40px' }).setOrigin(0.5).setAlpha(0);

    const frontRect = scene.add
      .rectangle(0, 0, CARD, CARD, COLORS.tagBg)
      .setStrokeStyle(2, COLORS.primary, 0.5)
      .setVisible(false);
    const frontText = scene.add
      .text(0, 0, displayGlyph(value), { fontSize: '42px' })
      .setOrigin(0.5)
      .setVisible(false);

    container.add([backRect, ghostText, backText, frontRect, frontText]);
    container.setSize(CARD, CARD);
    container.setInteractive(new Phaser.Geom.Rectangle(-CARD / 2, -CARD / 2, CARD, CARD), Phaser.Geom.Rectangle.Contains);
    container.input.cursor = 'pointer';
    container.on('pointerdown', () => {
      cursorIndex = index;
      updateCursorHighlight();
      attemptFlip(index);
    });

    if (isSpecial) {
      scene.tweens.add({ targets: backRect, alpha: { from: 1, to: 0.85 }, duration: 700, yoyo: true, repeat: -1 });
    }

    return {
      value,
      index,
      container,
      backRect,
      backText,
      ghostText,
      frontRect,
      frontText,
      isFlipped: false,
      isMatched: false,
      wrongCount: 0
    };
  }

  function destroyCards() {
    cards.forEach((c) => c.container.destroy());
    cards = [];
  }

  function stopAllTimers() {
    if (countdownEvent) {
      countdownEvent.remove();
      countdownEvent = null;
    }
    if (stopwatchEvent) {
      stopwatchEvent.remove();
      stopwatchEvent = null;
    }
  }

  function startCountdown() {
    countdownEvent = scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        remainingTime--;
        timerText.setText('Time: ' + Math.max(0, remainingTime) + 's');
        if (remainingTime <= 0) {
          countdownEvent.remove();
          finishRound('timeup');
        }
      }
    });
  }

  function startStopwatch() {
    stopwatchEvent = scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        elapsedSeconds++;
        timerText.setText('Time: ' + elapsedSeconds + 's');
      }
    });
    stopwatchEvent.paused = true;
  }

  function startRound() {
    destroyCards();
    stopAllTimers();

    flippedIndices = [];
    isAnimating = false;
    isPeeking = false;
    cursorIndex = 0;
    moves = 0;
    score = 0;
    comboCount = 0;
    matchedPairs = 0;

    gridOffsets = computeGridOffsets(currentDifficulty.cols, currentDifficulty.rows);

    scoreText.setText('Score: 0');
    movesText.setText('Moves: 0');
    highScoreText.setText('High: ' + getHighScore(currentDifficulty.key));
    diffLabelText.setText(currentDifficulty.label);
    comboText.setVisible(false);
    resultOverlay.setVisible(false);
    scene.tweens.killTweensOf(comboGlowBorder);
    comboGlowBorder.setAlpha(0);

    const deck = buildDeck(currentDifficulty.pairs);
    deck.forEach((value, index) => cards.push(createCard(value, index)));

    if (currentDifficulty.timeLimit > 0) {
      remainingTime = currentDifficulty.timeLimit;
      timerText.setText('Time: ' + remainingTime + 's');
      startCountdown();
    } else {
      elapsedSeconds = 0;
      timerText.setText('Time: 0s');
      startStopwatch();
    }

    state = 'playing';
    updateCursorHighlight();
  }

  function updateCursorHighlight() {
    if (state !== 'playing') {
      cursorHighlight.setVisible(false);
      return;
    }
    const pos = cardPosition(cursorIndex, currentDifficulty.cols, gridOffsets);
    cursorHighlight.setPosition(pos.x, pos.y);
    cursorHighlight.setVisible(true);
  }

  function attemptFlip(index) {
    if (state !== 'playing' || isAnimating || isPeeking) return;
    const card = cards[index];
    if (!card || card.isMatched || card.isFlipped) return;
    if (flippedIndices.length >= 2) return;

    if (currentDifficulty.timeLimit <= 0 && stopwatchEvent && stopwatchEvent.paused) {
      stopwatchEvent.paused = false;
    }

    card.isFlipped = true;
    flippedIndices.push(index);
    flipCardAnimation(card, true);

    if (flippedIndices.length === 2) {
      moves++;
      movesText.setText('Moves: ' + moves);
      isAnimating = true;
      scene.time.delayedCall(FLIP_DURATION * 2 + 60, evaluatePair);
    }
  }

  function flipCardAnimation(card, showFront) {
    scene.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: FLIP_DURATION,
      ease: 'Linear',
      onComplete: () => {
        card.backRect.setVisible(!showFront);
        card.backText.setVisible(!showFront);
        card.ghostText.setVisible(!showFront);
        card.frontRect.setVisible(showFront);
        card.frontText.setVisible(showFront);
        scene.tweens.add({ targets: card.container, scaleX: 1, duration: FLIP_DURATION, ease: 'Linear' });
      }
    });
  }

  function spawnFloatingText(x, y, text, color, fontSize) {
    const t = scene.add
      .text(x, y, text, {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: fontSize || '18px',
        fontStyle: 'bold',
        color
      })
      .setOrigin(0.5)
      .setDepth(560);

    scene.tweens.add({
      targets: t,
      y: y - 30,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy()
    });
  }

  function spawnComboPopup(text) {
    const t = scene.add
      .text(WIDTH / 2, HEIGHT / 2 - 60, text, {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: COLORS.goldStr
      })
      .setOrigin(0.5)
      .setDepth(560)
      .setScale(0.5)
      .setAlpha(0);

    scene.tweens.add({
      targets: t,
      scale: 1,
      alpha: 1,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: t,
          alpha: 0,
          y: t.y - 20,
          duration: 500,
          delay: 400,
          onComplete: () => t.destroy()
        });
      }
    });
  }

  function triggerComboGlow() {
    scene.tweens.killTweensOf(comboGlowBorder);
    comboGlowBorder.setAlpha(0.9);
    scene.tweens.add({ targets: comboGlowBorder, alpha: 0, duration: 900, ease: 'Cubic.easeOut' });
  }

  function triggerPeekReveal() {
    isPeeking = true;
    const targets = cards.filter((c) => !c.isMatched && !c.isFlipped);
    targets.forEach((c) => flipCardAnimation(c, true));

    scene.time.delayedCall(PEEK_REVEAL_DURATION, () => {
      targets.forEach((c) => {
        if (!c.isMatched) flipCardAnimation(c, false);
      });
      isPeeking = false;
    });
  }

  function evaluatePair() {
    const [i1, i2] = flippedIndices;
    const c1 = cards[i1];
    const c2 = cards[i2];

    const isMatch = c1.value === c2.value || c1.value === 'wild' || c2.value === 'wild';

    if (isMatch) {
      c1.isMatched = true;
      c2.isMatched = true;
      matchedPairs++;

      comboCount = Math.min(comboCount + 1, COMBO_CAP);
      const gained = BASE_PAIR_SCORE * comboCount;
      score += gained;
      scoreText.setText('Score: ' + score);

      const midX = (c1.container.x + c2.container.x) / 2;
      const midY = (c1.container.y + c2.container.y) / 2;
      spawnFloatingText(midX, midY, '+' + gained, comboCount >= 2 ? COLORS.goldStr : COLORS.primaryStr);

      if (comboCount >= 2) {
        comboText.setText('Combo x' + comboCount).setVisible(true);
        spawnComboPopup('COMBO x' + comboCount + '!');
        triggerComboGlow();
      }

      [c1, c2].forEach((c) => {
        c.container.disableInteractive();
        scene.tweens.add({ targets: c.container, alpha: 0.35, scale: 0.9, duration: 200 });
      });

      const involvesPeek = c1.value === 'peek' || c2.value === 'peek';

      flippedIndices = [];
      isAnimating = false;

      if (involvesPeek) triggerPeekReveal();

      if (matchedPairs === currentDifficulty.pairs) {
        finishRound('win');
      }
    } else {
      comboCount = 0;
      comboText.setVisible(false);

      [c1, c2].forEach((c) => {
        c.wrongCount++;
        const alpha = Math.max(GHOST_MIN, GHOST_BASE_ALPHA - (c.wrongCount - 1) * GHOST_DECAY);
        c.ghostText.setAlpha(alpha);
      });

      flipCardAnimation(c1, false);
      flipCardAnimation(c2, false);
      scene.time.delayedCall(FLIP_DURATION * 2, () => {
        c1.isFlipped = false;
        c2.isFlipped = false;
        flippedIndices = [];
        isAnimating = false;
      });
    }
  }

  function finishRound(outcome) {
    if (state !== 'playing') return;
    state = 'result';
    stopAllTimers();
    cursorHighlight.setVisible(false);

    let bonus = 0;
    if (outcome === 'win' && currentDifficulty.timeLimit > 0) {
      bonus = remainingTime * TIME_BONUS_PER_SEC;
      score += bonus;
      scoreText.setText('Score: ' + score);
    }

    const key = currentDifficulty.key;
    const isNewBest = score > getHighScore(key);
    if (isNewBest) setHighScore(key, score);
    updateSelectBest();

    showResultOverlay(outcome, bonus, isNewBest);
  }

  function showResultOverlay(outcome, bonus, isNewBest) {
    resultTitle.setText(outcome === 'win' ? 'CLEAR!' : 'TIME UP');
    resultTitle.setColor(outcome === 'win' ? COLORS.matchedStr : COLORS.accentStr);

    let stats = `Score: ${score}   Moves: ${moves}`;
    if (bonus > 0) stats += `\n(+${bonus} 시간 보너스)`;
    if (isNewBest) stats += '\nNEW BEST!';
    resultStats.setText(stats);

    resultOverlay.setVisible(true);
  }

  function returnToSelect() {
    resultOverlay.setVisible(false);
    destroyCards();
    selectCursor = 1;
    updateSelectHighlight();
    selectOverlay.setVisible(true);
    state = 'select';
  }

  function moveCursor(dx, dy) {
    if (state !== 'playing') return;
    const cols = currentDifficulty.cols;
    const rows = currentDifficulty.rows;
    const row = Math.floor(cursorIndex / cols);
    const col = cursorIndex % cols;
    const newRow = Phaser.Math.Clamp(row + dy, 0, rows - 1);
    const newCol = Phaser.Math.Clamp(col + dx, 0, cols - 1);
    cursorIndex = newRow * cols + newCol;
    updateCursorHighlight();
  }

  function setupInput(sceneRef) {
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

    sceneRef.input.keyboard.addCapture([
      KeyCodes.UP,
      KeyCodes.DOWN,
      KeyCodes.LEFT,
      KeyCodes.RIGHT,
      KeyCodes.SPACE,
      KeyCodes.ENTER
    ]);

    sceneRef.input.keyboard.on('keydown', (event) => {
      switch (event.code) {
        case 'ArrowUp':
          moveCursor(0, -1);
          break;
        case 'ArrowDown':
          moveCursor(0, 1);
          break;
        case 'ArrowLeft':
          if (state === 'select') moveSelectCursor(-1);
          else moveCursor(-1, 0);
          break;
        case 'ArrowRight':
          if (state === 'select') moveSelectCursor(1);
          else moveCursor(1, 0);
          break;
        case 'Enter':
        case 'Space':
          if (state === 'select') chooseDifficulty(selectCards[selectCursor].key);
          else if (state === 'playing') attemptFlip(cursorIndex);
          else if (state === 'result') returnToSelect();
          break;
      }
    });
  }

  const parentEl = document.querySelector('.game-stage') || 'game-container';

  const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: parentEl,
    backgroundColor: '#F7F8FC',
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
