(function () {
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
    currentTheme: 'day'
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
      PAWS.bestScores = JSON.parse(localStorage.getItem('fp_best')) || [];
      PAWS.selectedSkin = parseInt(localStorage.getItem('fp_skin')) || 0;
      PAWS.unlockedSkins = JSON.parse(localStorage.getItem('fp_unlocked')) || [true, false, false, false, false];
      PAWS.doubleJumpCount = parseInt(localStorage.getItem('fp_djcount')) || 0;
      PAWS.totalGames = parseInt(localStorage.getItem('fp_games')) || 0;
      PAWS.achievements = JSON.parse(localStorage.getItem('fp_ach')) || {};
      PAWS.bestCombo = parseInt(localStorage.getItem('fp_bestcombo')) || 0;
    } catch (e) {
      /* localStorage unavailable, keep defaults */
    }
  }

  function genShapeTexture(sceneRef, key, w, h, drawFn) {
    const g = sceneRef.make.graphics({ x: 0, y: 0, add: false });
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  function genShapeTextTexture(sceneRef, key, w, h, drawFn, text, style, tx, ty) {
    const g = sceneRef.make.graphics({ x: 0, y: 0, add: false });
    drawFn(g);

    const rt = sceneRef.add.renderTexture(0, 0, w, h).setVisible(false);
    rt.draw(g, 0, 0);

    const label = sceneRef.make.text({ x: tx, y: ty, text, style, add: false }).setOrigin(0.5);
    rt.draw(label, tx, ty);

    rt.saveTexture(key);
    rt.destroy();
    g.destroy();
    label.destroy();
  }

  function drawCloud(g, w, h) {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(w * 0.3, h * 0.6, h * 0.4);
    g.fillCircle(w * 0.55, h * 0.4, h * 0.5);
    g.fillCircle(w * 0.78, h * 0.6, h * 0.38);
    g.fillRect(w * 0.2, h * 0.55, w * 0.6, h * 0.35);
  }

  function drawRainbowRing(g, cx, cy, r, thickness) {
    const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
    const steps = colors.length;
    for (let i = 0; i < steps; i++) {
      const start = (i / steps) * Math.PI * 2 - Math.PI / 2;
      const end = ((i + 1) / steps) * Math.PI * 2 - Math.PI / 2;
      g.lineStyle(thickness, colors[i], 1);
      g.beginPath();
      g.arc(cx, cy, r, start, end, false);
      g.strokePath();
    }
  }

  function drawPipe(g, bodyColor, borderColor, capColor) {
    g.fillStyle(bodyColor, 1);
    g.fillRect(0, 0, 60, 400);
    g.lineStyle(3, borderColor, 1);
    g.strokeRect(1.5, 1.5, 57, 397);

    g.fillStyle(capColor, 1);
    g.fillRect(-4, 0, 68, 30);
    g.lineStyle(3, borderColor, 1);
    g.strokeRect(-2.5, 1.5, 65, 27);
  }

  const MEDAL_STYLE = { fontFamily: '"Space Grotesk", sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#FFFFFF' };

  function buildTextures(sceneRef) {
    genShapeTexture(sceneRef, 'bird_0', 48, 48, (g) => {
      g.fillStyle(0xffd600, 1);
      g.fillCircle(24, 24, 20);
      g.fillStyle(0xffa726, 1);
      g.fillTriangle(34, 22, 44, 24, 34, 28);
      g.fillStyle(0x000000, 1);
      g.fillCircle(30, 18, 4);
    });

    genShapeTexture(sceneRef, 'bird_1', 48, 48, (g) => {
      g.fillStyle(0x90a4ae, 1);
      g.fillCircle(24, 24, 20);
      g.fillTriangle(10, 10, 18, 2, 20, 14);
      g.fillTriangle(38, 10, 30, 2, 28, 14);
      g.fillStyle(0x000000, 1);
      g.fillCircle(30, 20, 3);
      g.fillStyle(0xf48fb1, 1);
      g.fillCircle(26, 26, 2.5);
      g.lineStyle(1, 0x546e7a, 0.8);
      g.lineBetween(30, 28, 40, 26);
      g.lineBetween(30, 30, 40, 32);
    });

    genShapeTexture(sceneRef, 'bird_2', 48, 48, (g) => {
      g.fillStyle(0x69f0ae, 1);
      g.fillCircle(24, 24, 20);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(17, 14, 8);
      g.fillCircle(31, 14, 8);
      g.fillStyle(0x000000, 1);
      g.fillCircle(17, 14, 4);
      g.fillCircle(31, 14, 4);
      g.lineStyle(2, 0x1b5e20, 0.8);
      g.beginPath();
      g.arc(24, 28, 8, 0.2, Math.PI - 0.2, false);
      g.strokePath();
    });

    genShapeTexture(sceneRef, 'bird_3', 48, 48, (g) => {
      g.fillStyle(0xf48fb1, 1);
      g.fillEllipse(16, 4, 8, 16);
      g.fillEllipse(32, 4, 8, 16);
      g.fillStyle(0xfafafa, 1);
      g.fillCircle(24, 24, 20);
      g.lineStyle(2, 0xe0e0e0, 1);
      g.strokeCircle(24, 24, 20);
      g.fillStyle(0x000000, 1);
      g.fillCircle(30, 20, 3);
      g.fillStyle(0xf48fb1, 1);
      g.fillCircle(24, 26, 2.5);
    });

    genShapeTexture(sceneRef, 'bird_4', 48, 48, (g) => {
      g.fillStyle(0x000000, 1);
      g.fillCircle(10, 8, 8);
      g.fillCircle(38, 8, 8);
      g.fillStyle(0xfafafa, 1);
      g.fillCircle(24, 24, 20);
      g.fillStyle(0x000000, 1);
      g.fillEllipse(16, 20, 8, 10);
      g.fillEllipse(32, 20, 8, 10);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(17, 20, 3);
      g.fillCircle(31, 20, 3);
      g.fillStyle(0x000000, 1);
      g.fillCircle(24, 28, 2.5);
    });

    genShapeTexture(sceneRef, 'pipe_day', 60, 400, (g) => drawPipe(g, 0x4caf50, 0x388e3c, 0x66bb6a));
    genShapeTexture(sceneRef, 'pipe_evening', 60, 400, (g) => drawPipe(g, 0xff7043, 0xe64a19, 0xff8a65));
    genShapeTexture(sceneRef, 'pipe_night', 60, 400, (g) => {
      drawPipe(g, 0x7c4dff, 0x651fff, 0xb388ff);
      g.lineStyle(2, 0xffffff, 0.5);
      g.lineBetween(15, 30, 15, 400);
    });

    genShapeTexture(sceneRef, 'cloud_s', 80, 40, (g) => drawCloud(g, 80, 40));
    genShapeTexture(sceneRef, 'cloud_m', 120, 55, (g) => drawCloud(g, 120, 55));
    genShapeTexture(sceneRef, 'cloud_l', 160, 65, (g) => drawCloud(g, 160, 65));

    genShapeTextTexture(
      sceneRef,
      'coin',
      24,
      24,
      (g) => {
        g.fillStyle(0xffd600, 1);
        g.fillCircle(12, 12, 11);
        g.lineStyle(2, 0xf9a825, 1);
        g.strokeCircle(12, 12, 11);
      },
      '★',
      { fontSize: '12px', color: '#FFFFFF' },
      12,
      12
    );

    genShapeTexture(sceneRef, 'star_p', 12, 12, (g) => {
      g.fillStyle(0xffffff, 1);
      g.beginPath();
      g.moveTo(6, 0);
      g.lineTo(7.5, 4.5);
      g.lineTo(12, 6);
      g.lineTo(7.5, 7.5);
      g.lineTo(6, 12);
      g.lineTo(4.5, 7.5);
      g.lineTo(0, 6);
      g.lineTo(4.5, 4.5);
      g.closePath();
      g.fillPath();
    });

    genShapeTextTexture(
      sceneRef,
      'medal_bronze',
      64,
      64,
      (g) => {
        g.fillStyle(0xcd7f32, 1);
        g.fillCircle(32, 32, 28);
        g.lineStyle(3, 0x8d5524, 1);
        g.strokeCircle(32, 32, 28);
      },
      'B',
      MEDAL_STYLE,
      32,
      32
    );

    genShapeTextTexture(
      sceneRef,
      'medal_silver',
      64,
      64,
      (g) => {
        g.fillStyle(0xb0bec5, 1);
        g.fillCircle(32, 32, 28);
        g.lineStyle(3, 0x78909c, 1);
        g.strokeCircle(32, 32, 28);
      },
      'S',
      MEDAL_STYLE,
      32,
      32
    );

    genShapeTextTexture(
      sceneRef,
      'medal_gold',
      64,
      64,
      (g) => {
        g.fillStyle(0xffd600, 1);
        g.fillCircle(32, 32, 28);
        g.lineStyle(3, 0xf9a825, 1);
        g.strokeCircle(32, 32, 28);
      },
      'G',
      MEDAL_STYLE,
      32,
      32
    );

    genShapeTextTexture(
      sceneRef,
      'medal_platinum',
      64,
      64,
      (g) => {
        drawRainbowRing(g, 32, 32, 29, 4);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(32, 32, 26);
      },
      'P',
      { fontFamily: '"Space Grotesk", sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#1A1D2E' },
      32,
      32
    );

    genShapeTexture(sceneRef, 'ground_day', 480, 80, (g) => {
      g.fillStyle(0x8bc34a, 1);
      g.fillRect(0, 0, 480, 80);
      g.fillStyle(0x558b2f, 1);
      g.fillRect(0, 0, 480, 2);
    });
    genShapeTexture(sceneRef, 'ground_evening', 480, 80, (g) => {
      g.fillStyle(0x795548, 1);
      g.fillRect(0, 0, 480, 80);
      g.fillStyle(0x4e342e, 1);
      g.fillRect(0, 0, 480, 2);
    });
    genShapeTexture(sceneRef, 'ground_night', 480, 80, (g) => {
      g.fillStyle(0x37474f, 1);
      g.fillRect(0, 0, 480, 80);
      g.fillStyle(0x263238, 1);
      g.fillRect(0, 0, 480, 2);
    });
  }

  class BootScene extends Phaser.Scene {
    constructor() {
      super('BootScene');
    }

    create() {
      loadState();
      buildTextures(this);
      console.log('✅ Textures ready');
      this.scene.start('SkinScene');
    }
  }

  const SKIN_NAMES = ['병아리', '고양이', '개구리', '토끼', '팬더'];
  const SKIN_UNLOCK_REQ = [0, 10, 25, 50, 100];

  class SkinScene extends Phaser.Scene {
    constructor() {
      super('SkinScene');
    }

    create() {
      this.selected = PAWS.selectedSkin;

      this.add.rectangle(240, 320, 480, 640, 0x87ceeb).setOrigin(0.5);
      this.add.image(240, 560, 'ground_day').setOrigin(0.5, 0);

      this.add
        .text(240, 45, 'Flappy Paws', {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#1A1D2E'
        })
        .setOrigin(0.5);
      this.add
        .text(440, 20, 'Best: ' + (PAWS.bestScores[0] || 0), {
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#5B6BFF'
        })
        .setOrigin(1, 0);

      const startX = 240 - 88 * 2;
      this.cardContainers = SKIN_NAMES.map((name, i) => this.buildCard(i, startX + i * 88, 230, SKIN_UNLOCK_REQ[i]));

      this.previewImage = this.add.image(240, 390, 'bird_' + this.selected).setDisplaySize(80, 80);
      this.tweens.add({
        targets: this.previewImage,
        y: 380,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.previewName = this.add
        .text(240, 440, SKIN_NAMES[this.selected], { fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#1A1D2E' })
        .setOrigin(0.5);

      this.buildPlayButton();
      this.refreshCards();
    }

    buildCard(i, cx, cy, req) {
      const c = this.add.container(cx, cy);
      const g = this.add.graphics();
      const bird = this.add.image(0, -8, 'bird_' + i).setDisplaySize(48, 48);
      const lock = this.add.text(0, -8, '🔒', { fontSize: '20px' }).setOrigin(0.5).setVisible(false);
      const cond = this.add
        .text(0, 34, req > 0 ? req + '점' : '', { fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#8890A4' })
        .setOrigin(0.5);

      c.add([g, bird, lock, cond]);
      c.setSize(80, 100);
      c.setInteractive(new Phaser.Geom.Rectangle(-40, -50, 80, 100), Phaser.Geom.Rectangle.Contains);
      c.input.cursor = 'pointer';
      c.on('pointerdown', () => this.onCardClick(i));

      c.gfx = g;
      c.bird = bird;
      c.lock = lock;
      c.baseY = cy;
      return c;
    }

    onCardClick(i) {
      if (!PAWS.unlockedSkins[i]) {
        const c = this.cardContainers[i];
        this.tweens.add({ targets: c, x: c.x - 5, duration: 60, yoyo: true, repeat: 5 });
        return;
      }

      this.selected = i;
      this.previewImage.setTexture('bird_' + i);
      this.previewName.setText(SKIN_NAMES[i]);
      this.refreshCards();
    }

    refreshCards() {
      this.cardContainers.forEach((c, i) => {
        const unlocked = PAWS.unlockedSkins[i];
        c.bird.setAlpha(unlocked ? 1 : 0.45);
        c.lock.setVisible(!unlocked);

        c.gfx.clear();
        c.gfx.fillStyle(0xffffff, 1);
        c.gfx.fillRoundedRect(-40, -50, 80, 100, 12);

        if (i === this.selected) {
          c.gfx.lineStyle(3, 0xff6b6b, 1);
        } else if (unlocked) {
          c.gfx.lineStyle(2, 0x5b6bff, 1);
        } else {
          c.gfx.lineStyle(2, 0xcccccc, 1);
        }
        c.gfx.strokeRoundedRect(-40, -50, 80, 100, 12);

        this.tweens.killTweensOf(c);
        c.y = c.baseY;
        if (i === this.selected) {
          this.tweens.add({ targets: c, y: c.baseY - 6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      });
    }

    buildPlayButton() {
      const bx = 240;
      const by = 530;
      const c = this.add.container(bx, by);

      const g = this.add.graphics();
      g.fillStyle(0x5b6bff, 1);
      g.fillRoundedRect(-80, -25, 160, 50, 25);

      const label = this.add
        .text(0, 0, '🐾 PLAY!', {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#FFFFFF'
        })
        .setOrigin(0.5);

      c.add([g, label]);
      c.setSize(160, 50);
      c.setInteractive(new Phaser.Geom.Rectangle(-80, -25, 160, 50), Phaser.Geom.Rectangle.Contains);
      c.input.cursor = 'pointer';
      c.on('pointerdown', () => {
        this.tweens.add({
          targets: c,
          scale: 0.9,
          duration: 80,
          yoyo: true,
          onComplete: () => {
            PAWS.selectedSkin = this.selected;
            saveState();
            this.scene.start('GameScene');
          }
        });
      });
    }
  }

  const THEMES = {
    day: { sky: 0x87ceeb, ground: 'ground_day', pipe: 'pipe_day' },
    evening: { sky: 0xff8a65, ground: 'ground_evening', pipe: 'pipe_evening' },
    night: { sky: 0x1a1d2e, ground: 'ground_night', pipe: 'pipe_night' },
    space: { sky: 0x000011, ground: 'ground_night', pipe: 'pipe_night' }
  };

  const COYOTE_MS = 150;
  const BUFFER_MS = 120;
  const JUMP_VY = -520;
  const DJ_VY = -420;

  const TRAIL_COLORS = [0xffd600, 0xf48fb1, 0x69f0ae, 0xffffff, 0x90a4ae];
  const RAINBOW = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];

  const ACHIEVEMENTS = {
    first_play: { name: '첫 날개짓', icon: '🐣', req: () => PAWS.totalGames >= 1 },
    score_10: { name: '하늘 입문', icon: '🌤', req: () => (PAWS.bestScores[0] || 0) >= 10 },
    score_25: { name: '별 사냥꾼', icon: '⭐', req: () => (PAWS.bestScores[0] || 0) >= 25 },
    score_50: { name: '우주비행사', icon: '🚀', req: () => (PAWS.bestScores[0] || 0) >= 50 },
    score_100: { name: '전설의 새', icon: '🏆', req: () => (PAWS.bestScores[0] || 0) >= 100 },
    combo_10: { name: '연속의 달인', icon: '🔥', req: () => PAWS.bestCombo >= 10 },
    dj_100: { name: '더블마스터', icon: '💫', req: () => PAWS.doubleJumpCount >= 100 },
    play_10: { name: '단골손님', icon: '🎮', req: () => PAWS.totalGames >= 10 }
  };

  function getDifficulty(score) {
    return {
      speed: Math.min(180 + score * 2.8, 320),
      gap: Math.max(165 - score * 1.4, 110),
      spacing: Math.max(3200 - score * 20, 2000)
    };
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
    }

    create() {
      this.currentThemeKey = 'day';
      this.currentSpeed = 180;
      PAWS.currentTheme = 'day';

      this.skyRect = this.add.rectangle(240, 320, 480, 640, THEMES.day.sky).setOrigin(0.5).setDepth(0);

      this.clouds = [];
      for (let i = 0; i < 5; i++) {
        const key = Phaser.Utils.Array.GetRandom(['cloud_s', 'cloud_m', 'cloud_l']);
        const cloud = this.add
          .image(Phaser.Math.Between(0, 480), Phaser.Math.Between(60, 250), key)
          .setDepth(2)
          .setAlpha(0.85);
        this.clouds.push(cloud);
      }

      this.buildBirdDecor();
      this.buildStarDecor();
      this.buildAuroraDecor();

      this.groundGroup = this.physics.add.staticGroup();
      this.ground = this.groundGroup.create(240, 600, 'ground_day').setOrigin(0.5, 0).setDepth(15);
      this.ground.refreshBody();

      this.bird = this.physics.add.image(120, 300, 'bird_' + PAWS.selectedSkin).setDepth(10);
      this.bird.body.setGravityY(0); // Phaser config gravity 사용

      this.canDoubleJump = false;
      this.hasDoubleJumped = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.isOnGround = true;
      this.gameStarted = false;
      this.isDead = false;
      this.trailTimer = 0;
      this.rainbowTrail = false;

      this.djHint = this.add.text(0, 0, '⭐⭐', { fontSize: '14px' }).setDepth(11).setVisible(false);

      this.scoreText = this.add
        .text(240, 55, '0', {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '52px',
          fontStyle: 'bold',
          color: '#FFFFFF',
          stroke: '#1A1D2E',
          strokeThickness: 5
        })
        .setOrigin(0.5)
        .setDepth(20);

      this.bestText = this.add
        .text(455, 18, 'Best: ' + (PAWS.bestScores[0] || 0), {
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.7)'
        })
        .setOrigin(1, 0)
        .setDepth(20);

      this.tapToStartText = this.add
        .text(240, 320, 'TAP TO START', {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#FFFFFF'
        })
        .setOrigin(0.5)
        .setDepth(20);
      this.tweens.add({
        targets: this.tapToStartText,
        y: 330,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.input.keyboard.on('keydown-SPACE', () => this.doJump());
      this.input.on('pointerdown', (p) => {
        if (p.y < 560) this.doJump();
      });

      this.soundsReady = false;
      const initSoundsOnce = () => {
        if (this.soundsReady) return;
        this.soundsReady = true;
        this.initSounds();
      };
      this.input.keyboard.on('keydown', initSoundsOnce);
      this.input.on('pointerdown', initSoundsOnce);

      this.pipePool = [];
      this.coinPool = [];
      for (let i = 0; i < 6; i++) {
        const top = this.physics.add.image(1200, 0, 'pipe_day').setDepth(5).setActive(false).setVisible(false);
        const bot = this.physics.add
          .image(1200, 0, 'pipe_day')
          .setDepth(5)
          .setActive(false)
          .setVisible(false)
          .setFlipY(true);
        top.body.allowGravity = false;
        bot.body.allowGravity = false;
        this.pipePool.push({ top, bot, scored: false });
      }
      for (let i = 0; i < 6; i++) {
        const c = this.physics.add.image(1200, 0, 'coin').setDepth(8).setActive(false).setVisible(false);
        c.body.allowGravity = false;
        this.coinPool.push(c);
      }
      this.lastGapY = 300;
      this.nextPipeX = 500;
    }

    update(time, delta) {
      this.updateClouds(delta);
      this.updateBirdDecor(time);
      this.updateAurora();
      this.updateJump(delta);
      this.updatePipesAndCoins();
    }

    updatePipesAndCoins() {
      this.pipePool.forEach((pair) => {
        if (!pair.top.active) return;

        if (!pair.scored && pair.top.x < this.bird.x - 30) {
          pair.scored = true;
          this.addScore();
        }

        if (pair.top.x < -80) {
          pair.top.setActive(false).setVisible(false);
          pair.bot.setActive(false).setVisible(false);
        }

        if (!this.isDead) {
          const bx = this.bird.x;
          const by = this.bird.y;
          [pair.top, pair.bot].forEach((pipe) => {
            if (Math.abs(bx - pipe.x) < 46 && Math.abs(by - pipe.y) < 216) this.hitObstacle();
          });
        }
      });

      this.coinPool.forEach((coin) => {
        if (!coin.active) return;
        if (Phaser.Math.Distance.Between(coin.x, coin.y, this.bird.x, this.bird.y) < 26) {
          coin.setActive(false).setVisible(false);
          this.tweens.killTweensOf(coin);
          this.collectCoin();
        }
        if (coin.x < -40) {
          coin.setActive(false).setVisible(false);
          this.tweens.killTweensOf(coin);
        }
      });

      if (this.bird.y > 558 && !this.isDead) this.hitObstacle();
      if (this.bird.y < 10) this.bird.setVelocityY(300);
    }

    spawnPipe() {
      const diff = getDifficulty(PAWS.score);
      const gapCenterY = Phaser.Math.Clamp(this.lastGapY + Phaser.Math.Between(-90, 90), 160, 480);
      this.lastGapY = gapCenterY;

      const pair = this.pipePool.find((p) => !p.top.active);
      if (pair) {
        const pipeKey = THEMES[this.currentThemeKey].pipe;
        pair.top.setTexture(pipeKey);
        pair.bot.setTexture(pipeKey);

        pair.top.setPosition(this.nextPipeX, gapCenterY - diff.gap / 2 - 200);
        pair.bot.setPosition(this.nextPipeX, gapCenterY + diff.gap / 2 + 200);
        pair.top.setVelocityX(-diff.speed);
        pair.bot.setVelocityX(-diff.speed);
        pair.top.setActive(true).setVisible(true);
        pair.bot.setActive(true).setVisible(true);
        pair.scored = false;

        if (Math.random() < 0.7) this.spawnCoin(this.nextPipeX, gapCenterY, diff.speed);
      }

      if (!this.isDead) {
        this.time.delayedCall(diff.spacing, () => this.spawnPipe());
      }
    }

    spawnCoin(x, y, speed) {
      const coin = this.coinPool.find((c) => !c.active);
      if (!coin) return;

      coin.setPosition(x, y);
      coin.setVelocityX(-speed);
      coin.setActive(true).setVisible(true);

      this.tweens.add({ targets: coin, y: y - 15, duration: 400, yoyo: true, repeat: -1 });
    }

    addScore() {
      PAWS.score++;
      PAWS.combo++;
      if (PAWS.combo > PAWS.bestCombo) PAWS.bestCombo = PAWS.combo;

      this.currentSpeed = getDifficulty(PAWS.score).speed;

      if (this.scoreText) this.scoreText.setText(PAWS.score);

      if (PAWS.score === 10) this.changeTheme('evening');
      if (PAWS.score === 25) this.changeTheme('night');
      if (PAWS.score === 50) this.changeTheme('space');

      this.checkSkinUnlocks();
      this.checkAchievements();

      if (typeof this.showComboEffect === 'function') this.showComboEffect();
      if (this.passSound) this.passSound();
    }

    checkSkinUnlocks() {
      SKIN_UNLOCK_REQ.forEach((req, i) => {
        if (req > 0 && !PAWS.unlockedSkins[i] && PAWS.score >= req) {
          PAWS.unlockedSkins[i] = true;
          if (typeof this.showUnlockBanner === 'function') this.showUnlockBanner(i);
        }
      });
    }

    checkAchievements() {
      Object.keys(ACHIEVEMENTS).forEach((key) => {
        if (!PAWS.achievements[key] && ACHIEVEMENTS[key].req()) {
          PAWS.achievements[key] = true;
          saveState();
          this.showAchievementToast(ACHIEVEMENTS[key]);
        }
      });
    }

    showAchievementToast(ach) {
      const c = this.add.container(370, 700).setDepth(23);
      const bg = this.add.rectangle(0, 0, 200, 54, 0x1a1d2e, 0.95).setStrokeStyle(2, 0xffd700, 1);
      const label = this.add
        .text(0, 0, ach.icon + ' 업적 달성!\n' + ach.name, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#FFFFFF',
          align: 'center'
        })
        .setOrigin(0.5);
      c.add([bg, label]);

      this.tweens.add({
        targets: c,
        y: 590,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(2000, () => {
            this.tweens.add({ targets: c, y: 700, alpha: 0, duration: 400, onComplete: () => c.destroy() });
          });
        }
      });
    }

    collectCoin() {
      if (this.coinSound) this.coinSound();

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const p = this.add.image(this.bird.x, this.bird.y, 'star_p').setDepth(11);
        this.tweens.add({
          targets: p,
          x: this.bird.x + Math.cos(angle) * 40,
          y: this.bird.y + Math.sin(angle) * 40,
          alpha: 0,
          duration: 300,
          onComplete: () => p.destroy()
        });
      }
    }

    hitObstacle() {
      if (this.isDead) return;
      this.isDead = true;
      PAWS.combo = 0;
      PAWS.totalGames++;
      this.checkAchievements();

      this.cameras.main.shake(300, 0.018);

      this.physics.world.timeScale = 4;
      this.time.timeScale = 0.25;
      setTimeout(() => {
        this.physics.world.timeScale = 1;
        this.time.timeScale = 1;
        this.showDeathEffect();
      }, 300);

      this.tweens.add({ targets: this.bird, angle: this.bird.angle + 720, y: 700, duration: 1200, ease: 'Cubic.easeIn' });

      if (this.deathSound) this.deathSound();
      if (navigator.vibrate) navigator.vibrate(50);

      setTimeout(() => {
        const isNew = this.checkNewRecord();
        PAWS.bestScores.push(PAWS.score);
        PAWS.bestScores.sort((a, b) => b - a);
        PAWS.bestScores = PAWS.bestScores.slice(0, 5);
        this.checkAchievements();
        saveState();
        this.scene.start('GameOverScene', { score: PAWS.score, isNewRecord: isNew, bestCombo: PAWS.bestCombo });
      }, 1600);
    }

    showDeathEffect() {
      this.spawnStarBurst(this.bird.x, this.bird.y);
      const x = this.add.text(this.bird.x, this.bird.y, '✕', { fontSize: '28px', color: '#FF6B6B' }).setOrigin(0.5).setDepth(21);
      this.tweens.add({ targets: x, alpha: 0, duration: 500, delay: 200, onComplete: () => x.destroy() });
    }

    checkNewRecord() {
      return PAWS.score > (PAWS.bestScores[0] || 0);
    }

    showComboEffect() {
      const combo = PAWS.combo;
      if (combo < 3) return;

      const labels = { 3: 'NICE!', 5: 'COMBO!', 8: 'GREAT!!', 10: 'AMAZING!!!', 15: 'LEGENDARY!!' };
      const text = labels[combo];

      if (text) {
        const color = combo >= 10 ? '#FFD700' : '#FF6B6B';
        const t = this.add
          .text(240, 160, text, {
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: '28px',
            fontStyle: 'bold',
            color,
            stroke: '#1A1D2E',
            strokeThickness: 4
          })
          .setOrigin(0.5)
          .setDepth(20)
          .setAlpha(0);

        this.tweens.add({
          targets: t,
          y: 130,
          alpha: 1,
          duration: 200,
          onComplete: () => {
            this.tweens.add({ targets: t, alpha: 0, duration: 300, delay: 600, onComplete: () => t.destroy() });
          }
        });
      }

      if (combo >= 5) this.showBorderGlow(combo >= 10 ? 0xff6b6b : 0xffd700);
      if (combo === 5) this.spawnStarBurst(240, 320);
      if (combo >= 10) {
        this.rainbowTrail = true;
        this.time.delayedCall(3000, () => {
          this.rainbowTrail = false;
        });
      }
    }

    showBorderGlow(color) {
      const g = this.add.rectangle(240, 320, 480, 640).setStrokeStyle(6, color, 1).setDepth(20).setAlpha(0.8);
      this.tweens.add({ targets: g, alpha: 0, duration: 800, onComplete: () => g.destroy() });
    }

    spawnStarBurst(x, y) {
      const colors = [0xffd700, 0xff6b6b, 0x5b6bff, 0x69f0ae, 0xff6ba8];
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = Phaser.Math.Between(80, 160);
        const s = this.add.image(x, y, 'star_p').setTint(colors[i % colors.length]).setDepth(20);
        this.tweens.add({
          targets: s,
          x: x + Math.cos(angle) * speed * 0.6,
          y: y + Math.sin(angle) * speed * 0.6,
          alpha: 0,
          scale: 0.1,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => s.destroy()
        });
      }
    }

    showUnlockBanner(skinIndex) {
      const c = this.add.container(240, 700).setDepth(22);
      const bg = this.add.rectangle(0, 0, 260, 64, 0x1a1d2e, 0.95).setStrokeStyle(2, 0xffd700, 1);
      const icon = this.add.image(-90, 0, 'bird_' + skinIndex).setDisplaySize(32, 32);
      const label = this.add
        .text(10, 0, '🎉 NEW SKIN!\n' + SKIN_NAMES[skinIndex], {
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: '#FFFFFF',
          align: 'center'
        })
        .setOrigin(0.5);
      c.add([bg, icon, label]);

      this.tweens.add({
        targets: c,
        y: 570,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(2500, () => {
            this.tweens.add({ targets: c, y: 700, alpha: 0, duration: 400, onComplete: () => c.destroy() });
          });
        }
      });
    }

    initSounds() {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (freq, type = 'sine', dur = 0.12, vol = 0.18, freqEnd = null) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = freq;
        if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + dur);
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.start();
        o.stop(ctx.currentTime + dur);
      };

      this.jumpSound = () => beep(520, 'sine', 0.12, 0.18, 780);
      this.doubleJumpSound = () => {
        beep(780, 'sine', 0.13, 0.2, 1100);
        setTimeout(() => beep(1000, 'sine', 0.1, 0.15), 60);
      };
      this.passSound = () => beep(880, 'triangle', 0.12, 0.12);
      this.coinSound = () => beep(1200, 'sine', 0.1, 0.1, 1600);
      this.deathSound = () => beep(400, 'sawtooth', 0.4, 0.25, 80);
      this.medalSound = () => {
        [660, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, 'sine', 0.25, 0.15), i * 100));
      };
    }

    startGame() {
      this.gameStarted = true;
      PAWS.score = 0;
      PAWS.combo = 0;
      PAWS.bestCombo = 0;
      this.isDead = false;

      if (this.tapToStartText) {
        this.tapToStartText.destroy();
        this.tapToStartText = null;
      }

      this.time.delayedCall(1800, () => this.spawnPipe());
    }

    doJump() {
      if (!this.gameStarted) {
        this.startGame();
        this.bird.setVelocityY(JUMP_VY);
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.isOnGround = false;
        if (this.jumpSound) this.jumpSound();
        return;
      }

      if (this.isOnGround || this.coyoteTimer > 0) {
        this.bird.setVelocityY(JUMP_VY);
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.coyoteTimer = 0;
        this.isOnGround = false;
        if (this.jumpSound) this.jumpSound();
        return;
      }

      if (this.canDoubleJump && !this.hasDoubleJumped) {
        this.bird.setVelocityY(DJ_VY);
        this.hasDoubleJumped = true;
        this.canDoubleJump = false;
        PAWS.doubleJumpCount++;
        this.cameras.main.shake(80, 0.004);
        this.spawnDJParticles();
        if (this.doubleJumpSound) this.doubleJumpSound();
        return;
      }

      this.jumpBufferTimer = BUFFER_MS;
    }

    updateJump(delta) {
      if (this.coyoteTimer > 0) this.coyoteTimer -= delta;

      if (this.jumpBufferTimer > 0) {
        this.jumpBufferTimer -= delta;
        if (this.isOnGround || this.coyoteTimer > 0 || (this.canDoubleJump && !this.hasDoubleJumped)) {
          this.jumpBufferTimer = 0;
          this.doJump();
        }
      }

      if (this.bird && this.bird.body) {
        const vy = this.bird.body.velocity.y;
        const targetAngle = Phaser.Math.Clamp(vy * 0.06, -20, 70);
        this.bird.angle = Phaser.Math.Linear(this.bird.angle, targetAngle, 0.18);

        if (this.bird.body.velocity.y > 620) this.bird.setVelocityY(620);

        this.trailTimer += delta;
        if (this.trailTimer > 35) {
          this.spawnTrail();
          this.trailTimer = 0;
        }
      }

      if (this.djHint) {
        this.djHint.setPosition(this.bird.x, this.bird.y - 36);
        this.djHint.setVisible(this.gameStarted && this.canDoubleJump && !this.hasDoubleJumped);
      }
    }

    spawnTrail() {
      const t = this.add.image(this.bird.x - 12, this.bird.y, 'bird_' + PAWS.selectedSkin).setDepth(9);
      t.setScale(0.65);
      t.setAlpha(0.3);
      t.setTint(this.rainbowTrail ? RAINBOW[Math.floor(Date.now() / 80) % 6] : TRAIL_COLORS[PAWS.selectedSkin]);
      this.tweens.add({ targets: t, alpha: 0, scale: 0.2, duration: 180, onComplete: () => t.destroy() });
    }

    spawnDJParticles() {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const speed = Phaser.Math.Between(60, 130);
        const p = this.add.image(this.bird.x, this.bird.y, 'star_p').setDepth(11);
        this.tweens.add({
          targets: p,
          x: this.bird.x + Math.cos(angle) * speed * 0.5,
          y: this.bird.y + Math.sin(angle) * speed * 0.5,
          alpha: 0,
          duration: 350,
          onComplete: () => p.destroy()
        });
      }

      const ring = this.add.circle(this.bird.x, this.bird.y, 10, 0xffffff, 0.6).setDepth(11);
      this.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
    }

    updateClouds(delta) {
      const speed = this.currentSpeed * 0.3 * (delta / 1000);
      this.clouds.forEach((cloud) => {
        cloud.x -= speed;
        if (cloud.x < -180) {
          cloud.x = 520;
          cloud.y = Phaser.Math.Between(60, 250);
        }
      });
    }

    buildBirdDecor() {
      this.decorBirds = [];
      for (let i = 0; i < 2; i++) {
        const b = this.add
          .text(Phaser.Math.Between(0, 480), Phaser.Math.Between(80, 180), '⌄', { fontSize: '14px', color: '#FFFFFF' })
          .setDepth(1)
          .setVisible(false);
        b.baseY = b.y;
        b.phase = Math.random() * Math.PI * 2;
        this.decorBirds.push(b);
      }
    }

    updateBirdDecor(time) {
      this.decorBirds.forEach((b) => {
        if (!b.visible) return;
        b.x += 0.5;
        if (b.x > 500) b.x = -20;
        b.y = b.baseY + Math.sin(time * 0.002 + b.phase) * 10;
      });
    }

    showBirdFlock() {
      this.decorBirds.forEach((b) => b.setVisible(true));
    }

    buildStarDecor() {
      this.decorStars = [];
      for (let i = 0; i < 20; i++) {
        const s = this.add
          .image(Phaser.Math.Between(0, 480), Phaser.Math.Between(0, 200), 'star_p')
          .setDepth(1)
          .setVisible(false)
          .setAlpha(0.2);
        this.decorStars.push(s);
        this.tweens.add({
          targets: s,
          alpha: { from: 0.2, to: 1 },
          duration: Phaser.Math.Between(800, 1800),
          yoyo: true,
          repeat: -1,
          delay: Phaser.Math.Between(0, 1000)
        });
      }
    }

    showStars() {
      this.decorStars.forEach((s) => s.setVisible(true));
    }

    startMeteorShower() {
      if (this.meteorTimer) return;
      this.meteorTimer = this.time.addEvent({ delay: 3000, loop: true, callback: () => this.spawnMeteor() });
    }

    spawnMeteor() {
      const startX = Phaser.Math.Between(300, 480);
      const line = this.add.graphics().setDepth(1);
      line.lineStyle(2, 0xffffff, 0.9);
      line.lineBetween(startX, 0, startX - 60, 60);
      this.tweens.add({ targets: line, x: '-=200', y: '+=200', alpha: 0, duration: 800, onComplete: () => line.destroy() });
    }

    buildAuroraDecor() {
      this.aurora = this.add.graphics().setDepth(1).setVisible(false);
      this.auroraOffset = 0;
    }

    showAurora() {
      this.aurora.setVisible(true);
    }

    updateAurora() {
      if (!this.aurora.visible) return;
      this.auroraOffset += 0.02;
      this.aurora.clear();

      this.aurora.lineStyle(6, 0x69f0ae, 0.25);
      this.aurora.beginPath();
      for (let x = 0; x <= 480; x += 20) {
        const y = 40 + Math.sin(x * 0.02 + this.auroraOffset) * 20;
        if (x === 0) this.aurora.moveTo(x, y);
        else this.aurora.lineTo(x, y);
      }
      this.aurora.strokePath();

      this.aurora.lineStyle(6, 0x9c27b0, 0.2);
      this.aurora.beginPath();
      for (let x = 0; x <= 480; x += 20) {
        const y = 60 + Math.sin(x * 0.02 + this.auroraOffset + 1) * 20;
        if (x === 0) this.aurora.moveTo(x, y);
        else this.aurora.lineTo(x, y);
      }
      this.aurora.strokePath();
    }

    changeTheme(newTheme) {
      if (this.currentThemeKey === newTheme) return;
      this.currentThemeKey = newTheme;
      PAWS.currentTheme = newTheme;
      const theme = THEMES[newTheme];
      const fromColor = Phaser.Display.Color.ValueToColor(this.skyRect.fillColor);

      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1500,
        onUpdate: (tw) => {
          const t = tw.getValue();
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(
            fromColor,
            Phaser.Display.Color.ValueToColor(theme.sky),
            100,
            Math.floor(t * 100)
          );
          this.skyRect.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        }
      });

      this.ground.setTexture(theme.ground);
      this.updateCloudVisibilityForTheme(newTheme);
    }

    updateCloudVisibilityForTheme(theme) {
      this.clouds.forEach((cloud) => {
        if (theme === 'day') {
          cloud.setVisible(true).setAlpha(0.85);
        } else if (theme === 'evening') {
          cloud.setVisible(true).setAlpha(0.4);
        } else {
          cloud.setVisible(false);
        }
      });
    }
  }

  class GameOverScene extends Phaser.Scene {
    constructor() {
      super('GameOverScene');
    }

    init(data) {
      this.finalScore = (data && data.score) || 0;
      this.isNewRecord = !!(data && data.isNewRecord);
      this.bestCombo = (data && data.bestCombo) || 0;
    }

    create() {
      this.add.rectangle(240, 320, 480, 640, 0xf7f8fc);
      this.drawDotGrid();

      const medal = this.getMedal(this.finalScore);
      if (medal) {
        const medalImg = this.add.image(240, -50, medal.key).setDisplaySize(96, 96);
        this.tweens.add({
          targets: medalImg,
          y: 130,
          scale: { from: 1.3, to: 1 },
          duration: 500,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({ targets: medalImg, angle: 8, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          }
        });
        this.medalSound();
        this.add
          .text(240, 190, medal.name, { fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8890A4' })
          .setOrigin(0.5);
      } else {
        this.add.text(240, 130, '😢', { fontSize: '64px' }).setOrigin(0.5);
      }

      this.add
        .text(240, 210, 'GAME OVER', { fontFamily: '"Space Grotesk", sans-serif', fontSize: '36px', fontStyle: 'bold', color: '#1A1D2E' })
        .setOrigin(0.5);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0xffffff, 1);
      cardBg.fillRoundedRect(240 - 140, 300 - 50, 280, 100, 14);
      cardBg.lineStyle(1, 0xeef0ff, 1);
      cardBg.strokeRoundedRect(240 - 140, 300 - 50, 280, 100, 14);

      const scoreLabel = this.isNewRecord ? `Score: ${this.finalScore} 🌟` : `Score: ${this.finalScore}`;
      this.add
        .text(240, 278, scoreLabel, {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#1A1D2E'
        })
        .setOrigin(0.5);
      this.add
        .text(240, 305, 'Best: ' + (PAWS.bestScores[0] || 0), { fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#5B6BFF' })
        .setOrigin(0.5);
      this.add
        .text(240, 328, 'Best Combo x' + this.bestCombo, { fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8890A4' })
        .setOrigin(0.5);

      if (this.isNewRecord) {
        const banner = this.add.container(240, 390).setScale(0);
        const bbg = this.add.rectangle(0, 0, 220, 44, 0xffd700, 1).setStrokeStyle(2, 0xe8a400, 1);
        const btext = this.add
          .text(0, 0, '🏆 NEW RECORD!', { fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#1A1D2E' })
          .setOrigin(0.5);
        banner.add([bbg, btext]);
        this.tweens.add({ targets: banner, scale: 1, duration: 400, ease: 'Back.easeOut' });

        for (let i = 0; i < 5; i++) {
          this.time.delayedCall(i * 200, () => {
            this.spawnConfetti(Phaser.Math.Between(60, 420), Phaser.Math.Between(150, 350));
          });
        }
      }

      this.buildButton(160, 450, '🏠 Menu', '#5B6BFF', false, () => this.scene.start('SkinScene'));
      this.buildButton(320, 450, '▶ Retry', '#5B6BFF', true, () => this.scene.start('GameScene'));

      this.buildTopFive();
    }

    getMedal(score) {
      if (score >= 50) return { key: 'medal_platinum', name: 'PLATINUM' };
      if (score >= 30) return { key: 'medal_gold', name: 'GOLD' };
      if (score >= 15) return { key: 'medal_silver', name: 'SILVER' };
      if (score >= 5) return { key: 'medal_bronze', name: 'BRONZE' };
      return null;
    }

    buildButton(x, y, label, color, filled, onClick) {
      const c = this.add.container(x, y);
      const colorInt = Phaser.Display.Color.HexStringToColor(color).color;
      const g = this.add.graphics();

      if (filled) {
        g.fillStyle(colorInt, 1);
        g.fillRoundedRect(-70, -22, 140, 44, 22);
      } else {
        g.lineStyle(2, colorInt, 1);
        g.strokeRoundedRect(-70, -22, 140, 44, 22);
      }

      const text = this.add
        .text(0, 0, label, {
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: filled ? '#FFFFFF' : color
        })
        .setOrigin(0.5);

      c.add([g, text]);
      c.setSize(140, 44);
      c.setInteractive(new Phaser.Geom.Rectangle(-70, -22, 140, 44), Phaser.Geom.Rectangle.Contains);
      c.input.cursor = 'pointer';
      c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.05, duration: 100 }));
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 100 }));
      c.on('pointerdown', onClick);
      return c;
    }

    buildTopFive() {
      this.add
        .text(240, 505, 'TOP 5', { fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8890A4' })
        .setOrigin(0.5);

      PAWS.bestScores.slice(0, 5).forEach((s, i) => {
        const isCurrent = s === this.finalScore;
        this.add
          .text(240, 525 + i * 20, `${i + 1}. ${s}`, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: isCurrent ? '#5B6BFF' : '#1A1D2E',
            fontStyle: isCurrent ? 'bold' : 'normal'
          })
          .setOrigin(0.5);
      });
    }

    drawDotGrid() {
      const g = this.add.graphics();
      g.fillStyle(0xeef0ff, 0.6);
      for (let x = 10; x < 480; x += 24) {
        for (let y = 10; y < 640; y += 24) {
          g.fillCircle(x, y, 1.5);
        }
      }
    }

    spawnConfetti(x, y) {
      const colors = [0xffd700, 0xff6b6b, 0x5b6bff, 0x69f0ae];
      const p = this.add.rectangle(x, -20, 6, 10, colors[Phaser.Math.Between(0, 3)]);
      this.tweens.add({
        targets: p,
        y,
        angle: 360,
        duration: 600,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.tweens.add({ targets: p, alpha: 0, duration: 300, onComplete: () => p.destroy() });
        }
      });
    }

    medalSound() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const beep = (freq, delay) => {
          setTimeout(() => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            o.start();
            o.stop(ctx.currentTime + 0.25);
          }, delay);
        };
        [660, 880, 1100].forEach((f, i) => beep(f, i * 100));
      } catch (e) {
        /* WebAudio unavailable, ignore */
      }
    }
  }

  const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 640,
    parent: document.querySelector('.game-stage') || document.body,
    backgroundColor: '#87CEEB',
    physics: { default: 'arcade', arcade: { gravity: { y: 1800 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, SkinScene, GameScene, GameOverScene]
  };

  new Phaser.Game(config);
})();
