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

  class SkinScene extends Phaser.Scene {
    constructor() {
      super('SkinScene');
    }

    create() {
      this.add.text(240, 320, 'SkinScene', { fontSize: '20px', color: '#1A1D2E' }).setOrigin(0.5);
      this.scene.start('GameScene');
    }
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
    }

    create() {}

    update() {}
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
