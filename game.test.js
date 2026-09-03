const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createClassList() {
  return {
    set: new Set(),
    add(...classes) {
      for (const cls of classes) this.set.add(cls);
    },
    remove(...classes) {
      for (const cls of classes) this.set.delete(cls);
    },
    contains(cls) {
      return this.set.has(cls);
    }
  };
}

function loadGame() {
  const ids = [
    'gameCanvas', 'gameOver', 'shopPanel', 'shopCoins', 'startScreen',
    'upgradesList', 'coinsDisplay', 'scoreDisplay', 'multiplierDisplay',
    'gameOverStats'
  ];

  const elements = Object.fromEntries(ids.map((id) => {
    const element = {
      classList: createClassList(),
      textContent: '',
      innerHTML: '',
      disabled: false,
      onclick: null,
      appendChild() {},
      addEventListener() {},
      setAttribute() {},
      style: {}
    };

    if (id === 'gameCanvas') {
      element.getContext = () => ({
        fillRect() {},
        clearRect() {},
        save() {},
        restore() {},
        translate() {},
        rotate() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
        arc() {},
        fill() {},
        fillText() {}
      });
    }

    return [id, element];
  }));

  const document = {
    getElementById(id) {
      return elements[id];
    },
    addEventListener() {},
    createElement() {
      return {
        classList: createClassList(),
        textContent: '',
        innerHTML: '',
        disabled: false,
        onclick: null,
        appendChild() {}
      };
    }
  };

  const localStorage = {
    data: {},
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null;
    },
    setItem(key, value) {
      this.data[key] = String(value);
    }
  };

  const context = {
    console,
    document,
    localStorage,
    window: {
      innerWidth: 1200,
      innerHeight: 800,
      addEventListener() {}
    },
    requestAnimationFrame() {},
    Math,
    setTimeout,
    clearTimeout
  };

  vm.createContext(context);
  const code = fs.readFileSync('./game.js', 'utf8');
  vm.runInContext(code, context);

  return { elements, context };
}

test('hideShop returns to start screen when no game is active', () => {
  const { elements, context } = loadGame();

  context.showShop();
  assert.equal(elements.startScreen.classList.contains('hidden'), true, 'start screen should be hidden while shop is open');

  context.hideShop();
  assert.equal(elements.startScreen.classList.contains('hidden'), false, 'start screen should reappear when closing shop before starting');
  assert.equal(elements.shopPanel.classList.contains('hidden'), true, 'shop panel should be hidden after closing');
});

test('shop contains the original upgrades plus 180 additional items', () => {
  const { context } = loadGame();

  assert.equal(vm.runInContext('Object.keys(UPGRADES).length', context), 186);
});

test('showShop closes the crash overlay so its button is usable', () => {
  const { elements, context } = loadGame();

  elements.gameOver.classList.remove('hidden');
  context.showShop();

  assert.equal(elements.gameOver.classList.contains('hidden'), true);
  assert.equal(elements.shopPanel.classList.contains('hidden'), false);
});

test('startGame hides any prior game-over and shop overlays', () => {
  const { elements, context } = loadGame();

  elements.gameOver.classList.remove('hidden');
  elements.shopPanel.classList.remove('hidden');

  context.startGame();

  assert.equal(elements.gameOver.classList.contains('hidden'), true, 'game over overlay should close when a new run starts');
  assert.equal(elements.shopPanel.classList.contains('hidden'), true, 'shop panel should close when the game starts');
  assert.equal(elements.startScreen.classList.contains('hidden'), true, 'start screen should hide when the game starts');
});

test('loadGame restores missing upgrade values with sane defaults', () => {
  const { context } = loadGame();
  context.localStorage.setItem('driftMasterGame', JSON.stringify({ coins: 42, upgrades: { speed: 2 } }));

  vm.runInContext('loadGame()', context);
  const gameState = vm.runInContext('gameState', context);

  assert.equal(gameState.coins, 42, 'saved coins should be restored');
  assert.equal(gameState.upgrades.speed, 2, 'stored upgrade levels should be kept');
  assert.equal(gameState.upgrades.acceleration, 0, 'missing upgrades should default to zero');
  assert.equal(gameState.upgrades.driftBoost, 0, 'all upgrade keys should exist after loading');
});

test('car stays fixed while the world scrolls faster over time', () => {
  const { context } = loadGame();

  vm.runInContext('startGame()', context);
  const game = vm.runInContext('game', context);
  const originalY = game.car.y;
  const initialSpeed = game.worldSpeed;

  for (let i = 0; i < 120; i++) {
    game.update();
  }

  assert.equal(game.car.y, originalY, 'car should remain fixed vertically while the level scrolls');
  assert.ok(game.worldSpeed > initialSpeed, 'game speed should increase as the run progresses');
});

test('jump works without nitro XP and clears obstacles while airborne', () => {
  const { context } = loadGame();
  const car = vm.runInContext('new Car()', context);
  const obstacle = vm.runInContext('new Obstacle(600)', context);

  assert.equal(car.jump(), true, 'a grounded car should be able to jump');
  assert.equal(car.jumpHeight > 0, true, 'jump should work without XP');
  assert.equal(obstacle.collidesWith(car), false, 'airborne car should clear the obstacle');

  car.jumpHeight = 0;
  assert.equal(obstacle.collidesWith(car), true, 'grounded car should still collide');
});
