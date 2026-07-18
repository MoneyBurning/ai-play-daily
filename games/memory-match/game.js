(function () {
  const WIDTH = 480;
  const HEIGHT = 560;
  const GRID_SIZE = 4;
  const CARD = 105;
  const GAP = 10;
  const PADDING = 15;
  const GRID_TOP = 80;
  const MISMATCH_DELAY = 700;
  const FLIP_DURATION = 120;

  const SYMBOLS = ['🍎', '🍌', '🍇', '🍉', '🍒', '🍋', '🥝', '🍓'];

  const COLORS = {
    bg: 0x1a1d2e,
    cardBack: 0x5b6bff,
    cardBackHi: 0x8892ff,
    cardFront: 0xffffff,
    matched: 0x22c1a0,
    text: '#FFFFFF',
    accent: '#FF6B6B'
  };

  let scene;
  let cards = [];
  let flippedIndices = [];
  let isAnimating = false;
  let cursorIndex = 0;
  let moves = 0;
  let elapsedSeconds = 0;
  let matchedPairs = 0;
  let timerEvent = null;
  let isWon = false;

  let timerText, movesText, cursorHighlight, winOverlay;

  function create() {
    scene = this;

    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg).setOrigin(0);

    timerText = this.add.text(PADDING, 24, 'Time: 0s', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: COLORS.text
    });

    movesText = this.add.text(WIDTH - PADDING, 24, 'Moves: 0', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: COLORS.text
    }).setOrigin(1, 0);

    cursorHighlight = this.add.rectangle(0, 0, CARD + 8, CARD + 8)
      .setStrokeStyle(3, 0xff6b6b, 1)
      .setFillStyle()
      .setVisible(false);

    winOverlay = createWinOverlay(this);

    setupInput(this);
    startGame();
  }

  function createWinOverlay(sceneRef) {
    const group = sceneRef.add.container(WIDTH / 2, HEIGHT / 2).setVisible(false);

    const backdrop = sceneRef.add.rectangle(0, 0, WIDTH, HEIGHT, 0x1a1d2e, 0.92);
    const title = sceneRef.add.text(0, -50, 'CLEAR!', {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '40px',
      fontStyle: 'bold',
      color: COLORS.accent
    }).setOrigin(0.5);

    const statsText = sceneRef.add.text(0, 10, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: COLORS.text,
      align: 'center'
    }).setOrigin(0.5);

    const restartText = sceneRef.add.text(0, 60, 'Press SPACE to restart', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      color: '#8890A4'
    }).setOrigin(0.5);

    group.add([backdrop, title, statsText, restartText]);
    group.statsText = statsText;
    return group;
  }

  function buildDeck() {
    const values = SYMBOLS.concat(SYMBOLS);
    for (let i = values.length - 1; i > 0; i--) {
      const j = Phaser.Math.Between(0, i);
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  function cardPosition(index) {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return {
      x: PADDING + CARD / 2 + col * (CARD + GAP),
      y: GRID_TOP + CARD / 2 + row * (CARD + GAP)
    };
  }

  function startGame() {
    cards.forEach((c) => c.container.destroy());
    cards = [];
    flippedIndices = [];
    isAnimating = false;
    cursorIndex = 0;
    moves = 0;
    elapsedSeconds = 0;
    matchedPairs = 0;
    isWon = false;

    movesText.setText('Moves: 0');
    timerText.setText('Time: 0s');
    winOverlay.setVisible(false);

    const deck = buildDeck();

    deck.forEach((value, index) => {
      const pos = cardPosition(index);
      const container = scene.add.container(pos.x, pos.y);

      const backRect = scene.add.rectangle(0, 0, CARD, CARD, COLORS.cardBack)
        .setStrokeStyle(2, COLORS.cardBackHi);
      const backText = scene.add.text(0, 0, '?', {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '32px',
        color: COLORS.text
      }).setOrigin(0.5);

      const frontRect = scene.add.rectangle(0, 0, CARD, CARD, COLORS.cardFront)
        .setStrokeStyle(2, 0xeef0ff)
        .setVisible(false);
      const frontText = scene.add.text(0, 0, value, {
        fontSize: '44px'
      }).setOrigin(0.5).setVisible(false);

      container.add([backRect, backText, frontRect, frontText]);
      container.setSize(CARD, CARD);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        cursorIndex = index;
        updateCursorHighlight();
        attemptFlip(index);
      });

      cards.push({
        value,
        index,
        container,
        backRect,
        backText,
        frontRect,
        frontText,
        isFlipped: false,
        isMatched: false
      });
    });

    if (timerEvent) timerEvent.remove();
    timerEvent = scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        elapsedSeconds++;
        timerText.setText('Time: ' + elapsedSeconds + 's');
      }
    });
    timerEvent.paused = true;

    updateCursorHighlight();
  }

  function updateCursorHighlight() {
    const pos = cardPosition(cursorIndex);
    cursorHighlight.setPosition(pos.x, pos.y);
    cursorHighlight.setVisible(!isWon);
  }

  function attemptFlip(index) {
    if (isWon || isAnimating) return;
    const card = cards[index];
    if (!card || card.isMatched || card.isFlipped) return;
    if (flippedIndices.length >= 2) return;

    if (timerEvent.paused) timerEvent.paused = false;

    card.isFlipped = true;
    flippedIndices.push(index);
    flipAnimation(card, true);

    if (flippedIndices.length === 2) {
      moves++;
      movesText.setText('Moves: ' + moves);
      isAnimating = true;
      scene.time.delayedCall(FLIP_DURATION * 2 + 60, evaluatePair);
    }
  }

  function flipAnimation(card, showFront) {
    scene.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: FLIP_DURATION,
      ease: 'Linear',
      onComplete: () => {
        card.backRect.setVisible(!showFront);
        card.backText.setVisible(!showFront);
        card.frontRect.setVisible(showFront);
        card.frontText.setVisible(showFront);
        scene.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: FLIP_DURATION,
          ease: 'Linear'
        });
      }
    });
  }

  function evaluatePair() {
    const [i1, i2] = flippedIndices;
    const c1 = cards[i1];
    const c2 = cards[i2];

    if (c1.value === c2.value) {
      c1.isMatched = true;
      c2.isMatched = true;
      matchedPairs++;

      [c1, c2].forEach((c) => {
        c.container.disableInteractive();
        scene.tweens.add({
          targets: c.container,
          alpha: 0.35,
          scale: 0.92,
          duration: 200
        });
      });

      flippedIndices = [];
      isAnimating = false;

      if (matchedPairs === SYMBOLS.length) {
        win();
      }
    } else {
      flipAnimation(c1, false);
      flipAnimation(c2, false);
      scene.time.delayedCall(FLIP_DURATION * 2, () => {
        c1.isFlipped = false;
        c2.isFlipped = false;
        flippedIndices = [];
        isAnimating = false;
      });
    }
  }

  function win() {
    isWon = true;
    timerEvent.paused = true;
    cursorHighlight.setVisible(false);
    winOverlay.statsText.setText(`Time: ${elapsedSeconds}s   Moves: ${moves}`);
    winOverlay.setVisible(true);
  }

  function moveCursor(dx, dy) {
    if (isWon) return;
    const row = Math.floor(cursorIndex / GRID_SIZE);
    const col = cursorIndex % GRID_SIZE;
    const newRow = Phaser.Math.Clamp(row + dy, 0, GRID_SIZE - 1);
    const newCol = Phaser.Math.Clamp(col + dx, 0, GRID_SIZE - 1);
    cursorIndex = newRow * GRID_SIZE + newCol;
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
          moveCursor(-1, 0);
          break;
        case 'ArrowRight':
          moveCursor(1, 0);
          break;
        case 'Enter':
          if (!isWon) attemptFlip(cursorIndex);
          break;
        case 'Space':
          if (isWon) startGame();
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
    backgroundColor: '#1A1D2E',
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
