(function () {
  const WIDTH = 600;
  const HEIGHT = 400;
  const CELL = 20;
  const COLS = WIDTH / CELL;
  const ROWS = HEIGHT / CELL;
  const MOVE_DELAY = 120;
  const SWIPE_THRESHOLD = 20;

  const COLORS = {
    bg: 0x1a1d2e,
    grid: 0x2a2e45,
    snake: 0x5b6bff,
    snakeHead: 0x8892ff,
    food: 0xff6b6b,
    text: '#FFFFFF'
  };

  let scene;
  let graphics, scoreText, gameOverText, restartText;
  let snake, direction, nextDirection, food, moveTimer, score, isGameOver;
  let touchStart = null;

  function create() {
    scene = this;
    graphics = this.add.graphics();

    scoreText = this.add.text(10, 10, 'Score: 0', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: COLORS.text
    });

    gameOverText = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 20, 'GAME OVER', {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#FF6B6B'
      })
      .setOrigin(0.5)
      .setVisible(false);

    restartText = this.add
      .text(WIDTH / 2, HEIGHT / 2 + 20, 'Press SPACE to restart', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: COLORS.text
      })
      .setOrigin(0.5)
      .setVisible(false);

    setupInput(this);
    resetGame();
  }

  function resetGame() {
    snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    isGameOver = false;

    scoreText.setText('Score: 0');
    gameOverText.setVisible(false);
    restartText.setVisible(false);

    spawnFood();

    if (moveTimer) moveTimer.remove();
    moveTimer = scene.time.addEvent({
      delay: MOVE_DELAY,
      callback: moveSnake,
      loop: true
    });

    draw();
  }

  function spawnFood() {
    let pos;
    do {
      pos = {
        x: Phaser.Math.Between(0, COLS - 1),
        y: Phaser.Math.Between(0, ROWS - 1)
      };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function moveSnake() {
    if (isGameOver) return;

    direction = nextDirection;
    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    const hitsWall =
      newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
    const hitsSelf = snake.some((s) => s.x === newHead.x && s.y === newHead.y);

    if (hitsWall || hitsSelf) {
      gameOver();
      return;
    }

    snake.unshift(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
      score += 10;
      scoreText.setText('Score: ' + score);
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    isGameOver = true;
    moveTimer.remove();
    gameOverText.setVisible(true);
    restartText.setVisible(true);
  }

  function draw() {
    graphics.clear();

    graphics.fillStyle(COLORS.bg, 1);
    graphics.fillRect(0, 0, WIDTH, HEIGHT);

    graphics.lineStyle(1, COLORS.grid, 0.4);
    for (let x = 0; x <= COLS; x++) {
      graphics.lineBetween(x * CELL, 0, x * CELL, HEIGHT);
    }
    for (let y = 0; y <= ROWS; y++) {
      graphics.lineBetween(0, y * CELL, WIDTH, y * CELL);
    }

    graphics.fillStyle(COLORS.food, 1);
    graphics.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);

    snake.forEach((segment, index) => {
      graphics.fillStyle(index === 0 ? COLORS.snakeHead : COLORS.snake, 1);
      graphics.fillRect(
        segment.x * CELL + 1,
        segment.y * CELL + 1,
        CELL - 2,
        CELL - 2
      );
    });
  }

  function setDirection(x, y) {
    if (isGameOver) return;
    if (direction.x === -x && direction.y === -y) return;
    if (direction.x === x && direction.y === y) return;
    nextDirection = { x, y };
  }

  function setupInput(sceneRef) {
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

    sceneRef.input.keyboard.addCapture([
      KeyCodes.UP,
      KeyCodes.DOWN,
      KeyCodes.LEFT,
      KeyCodes.RIGHT,
      KeyCodes.SPACE,
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
          if (isGameOver) resetGame();
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
        if (isGameOver) resetGame();
        touchStart = null;
        return;
      }

      if (absDx > absDy) {
        setDirection(dx > 0 ? 1 : -1, 0);
      } else {
        setDirection(0, dy > 0 ? 1 : -1);
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
