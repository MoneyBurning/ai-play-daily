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

  class BootScene extends Phaser.Scene {
    constructor() {
      super('BootScene');
    }

    create() {
      loadState();
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
