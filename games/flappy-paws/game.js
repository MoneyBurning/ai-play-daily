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
    }

    update(time, delta) {
      this.updateClouds(delta);
      this.updateBirdDecor(time);
      this.updateAurora();
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

    create() {
      this.add.text(240, 320, 'GAME OVER', { fontSize: '32px', color: '#1A1D2E' }).setOrigin(0.5);
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
