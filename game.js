add// Game Configuration
let CANVAS_WIDTH = window.innerWidth;
let CANVAS_HEIGHT = window.innerHeight;
const ROAD_EDGE = 50;

// Upgrades Configuration
const UPGRADE_CATEGORIES = {
    performance: {
        name: '⚡ Performance',
        description: 'Boost your car\'s core performance'
    },
    handling: {
        name: '🎯 Handling',
        description: 'Improve control and maneuverability'
    },
    utility: {
        name: '🛡️ Utility',
        description: 'Special abilities and protection'
    },
    decal: {
        name: '🎨 Decals',
        description: 'Cosmetic visual upgrades'
    },
    engine: {
        name: '🔧 Engine',
        description: 'Engine and mechanical upgrades'
    },
    suspension: {
        name: '🛞 Suspension',
        description: 'Tire and grip upgrades'
    },
    wheels: {
        name: '⭕ Wheels',
        description: 'Rim and wheel upgrades'
    },
    exhaust: {
        name: '💨 Exhaust',
        description: 'Exhaust system upgrades'
    },
    chassis: {
        name: '🏗️ Chassis',
        description: 'Frame and structure upgrades'
    }
};

const UPGRADES = {
    speed: {
        category: 'performance',
        name: "Max Speed",
        description: "Increase maximum speed",
        baseCost: 100,
        costMultiplier: 1.15,
        maxLevel: 10,
        effect: (level) => 8 + level * 0.5
    },
    acceleration: {
        category: 'performance',
        name: "Acceleration",
        description: "Improve acceleration rate",
        baseCost: 80,
        costMultiplier: 1.15,
        maxLevel: 10,
        effect: (level) => 0.3 + level * 0.02
    },
    handling: {
        category: 'handling',
        name: "Handling",
        description: "Better turn control",
        baseCost: 120,
        costMultiplier: 1.15,
        maxLevel: 10,
        effect: (level) => 0.08 + level * 0.01
    },
    driftBoost: {
        category: 'performance',
        name: "Drift Multiplier",
        description: "Increase drift score multiplier",
        baseCost: 150,
        costMultiplier: 1.2,
        maxLevel: 8,
        effect: (level) => 1 + level * 0.3
    },
    coinMagnet: {
        category: 'utility',
        name: "Coin Magnet",
        description: "Attract coins from further away",
        baseCost: 200,
        costMultiplier: 1.25,
        maxLevel: 8,
        effect: (level) => 100 + level * 50
    },
    shieldHP: {
        category: 'utility',
        name: "Shield HP",
        description: "Extra protection hit points",
        baseCost: 180,
        costMultiplier: 1.2,
        maxLevel: 5,
        effect: (level) => level
    }
};

const SHOP_ITEM_TYPES = [
    ['Neon Decal', 'Give your car a sharper look', 'decal'],
    ['Engine Tune', 'Fine-tune the engine response', 'engine'],
    ['Tire Compound', 'Refresh the grip setup', 'suspension'],
    ['Rim Set', 'Swap in a lighter rim set', 'wheels'],
    ['Exhaust Kit', 'Add a more aggressive exhaust note', 'exhaust'],
    ['Chassis Plate', 'Reinforce the frame finish', 'chassis']
];

for (let itemNumber = 1; itemNumber <= 180; itemNumber++) {
    const itemTypeData = SHOP_ITEM_TYPES[(itemNumber - 1) % SHOP_ITEM_TYPES.length];
    const [itemType, itemDescription, category] = itemTypeData;
    UPGRADES[`shopItem${itemNumber}`] = {
        category: category,
        name: `${itemType} ${itemNumber}`,
        description: itemDescription,
        baseCost: 25 + itemNumber * 5,
        costMultiplier: 1,
        maxLevel: 1,
        effect: (level) => level
    };
}

// Music Playlist Configuration (Free Music)
const MUSIC_TRACKS = [
    { name: 'Neon Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { name: 'Electric Dreams', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { name: 'Retro Synth', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { name: 'Drift Kings', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { name: 'Night Speed', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { name: 'Highway Lights', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
];

// Game State
let gameState = {
    coins: 0,
    score: 0,
    multiplier: 1,
    gameActive: false,
    upgrades: {},
    selectedCategory: 'performance',
    currentMusicTrack: 0
};

let musicContext = null;
let musicTimer = null;
let musicEnabled = true;

// Initialize upgrades
Object.keys(UPGRADES).forEach(key => {
    gameState.upgrades[key] = 0;
});

// Load saved game
function loadGame() {
    const saved = localStorage.getItem('driftMasterGame');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.coins = Number.isFinite(data.coins) ? data.coins : 0;
            gameState.upgrades = Object.keys(UPGRADES).reduce((upgrades, key) => {
                const savedLevel = data.upgrades && data.upgrades[key];
                upgrades[key] = Number.isFinite(savedLevel) ? savedLevel : 0;
                return upgrades;
            }, {});
            gameState.selectedCategory = data.selectedCategory || 'performance';
            gameState.currentMusicTrack = data.currentMusicTrack || 0;
        } catch (error) {
            localStorage.removeItem('driftMasterGame');
        }
    }
}

// Save game
function saveGame() {
    localStorage.setItem('driftMasterGame', JSON.stringify({
        coins: gameState.coins,
        upgrades: gameState.upgrades,
        selectedCategory: gameState.selectedCategory,
        currentMusicTrack: gameState.currentMusicTrack
    }));
}

// Get upgrade cost
function getUpgradeCost(upgradeKey) {
    const upgrade = UPGRADES[upgradeKey];
    const level = gameState.upgrades[upgradeKey];
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}

// Get upgrade value
function getUpgradeValue(upgradeKey) {
    const upgrade = UPGRADES[upgradeKey];
    const level = gameState.upgrades[upgradeKey];
    return upgrade.effect(level);
}

// Purchase upgrade
function purchaseUpgrade(upgradeKey) {
    if (gameState.gameActive) return;
    
    const upgrade = UPGRADES[upgradeKey];
    const currentLevel = gameState.upgrades[upgradeKey];
    
    if (currentLevel >= upgrade.maxLevel) return;
    
    const cost = getUpgradeCost(upgradeKey);
    
    if (gameState.coins >= cost) {
        gameState.coins -= cost;
        gameState.upgrades[upgradeKey]++;
        saveGame();
        updateShopDisplay();
    }
}

// Update shop display
function updateShopDisplay() {
    document.getElementById('shopCoins').textContent = gameState.coins;
    
    // Create category tabs if they don't exist
    let categoryTabs = document.getElementById('categoryTabs');
    if (!categoryTabs) {
        const shopPanel = document.getElementById('shopPanel');
        const coinsInfo = shopPanel.querySelector('.coinsInfo');
        
        categoryTabs = document.createElement('div');
        categoryTabs.id = 'categoryTabs';
        categoryTabs.className = 'categoryTabs';
        
        Object.keys(UPGRADE_CATEGORIES).forEach(categoryKey => {
            const category = UPGRADE_CATEGORIES[categoryKey];
            const button = document.createElement('button');
            button.className = 'categoryTab';
            button.textContent = category.name;
            button.onclick = () => {
                gameState.selectedCategory = categoryKey;
                saveGame();
                updateShopDisplay();
            };
            categoryTabs.appendChild(button);
        });
        
        coinsInfo.parentNode.insertBefore(categoryTabs, coinsInfo.nextSibling);
    }
    
    // Update active tab
    document.querySelectorAll('.categoryTab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const selectedCategoryName = UPGRADE_CATEGORIES[gameState.selectedCategory]?.name;
    document.querySelectorAll('.categoryTab').forEach(tab => {
        if (tab.textContent === selectedCategoryName) {
            tab.classList.add('active');
        }
    });
    
    const upgradesList = document.getElementById('upgradesList');
    upgradesList.innerHTML = '';
    
    // Group upgrades by category
    const upgradedByCategory = {};
    Object.keys(UPGRADES).forEach(key => {
        const upgrade = UPGRADES[key];
        const category = upgrade.category || 'other';
        if (!upgradedByCategory[category]) {
            upgradedByCategory[category] = [];
        }
        upgradedByCategory[category].push({ key, upgrade });
    });
    
    // Display only selected category
    const selectedCategory = gameState.selectedCategory;
    const category = UPGRADE_CATEGORIES[selectedCategory];
    
    if (!upgradedByCategory[selectedCategory] || upgradedByCategory[selectedCategory].length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No upgrades in this category';
        upgradesList.appendChild(empty);
        return;
    }
    
    // Create category header
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'categoryHeader';
    categoryHeader.innerHTML = `
        <h3>${category.name}</h3>
        <p>${category.description}</p>
    `;
    upgradesList.appendChild(categoryHeader);
    
    // Create category container
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'categoryContainer';
    
    // Add each upgrade in this category
    upgradedByCategory[selectedCategory].forEach(({ key, upgrade }) => {
        const level = gameState.upgrades[key];
        const maxLevel = upgrade.maxLevel;
        const cost = getUpgradeCost(key);
        const canBuy = gameState.coins >= cost && level < maxLevel;
        
        const item = document.createElement('div');
        item.className = 'upgradeItem' + (level >= maxLevel ? ' maxed' : '');
        
        const upgradeName = document.createElement('div');
        upgradeName.className = 'upgradeName';
        upgradeName.innerHTML = `<span>${upgrade.name}</span><span>${cost} coins</span>`;
        
        const desc = document.createElement('div');
        desc.className = 'upgradeDesc';
        desc.textContent = upgrade.description;
        
        const levelInfo = document.createElement('div');
        levelInfo.className = 'upgradeLevel';
        levelInfo.textContent = `Level: ${level}/${maxLevel}`;
        
        const button = document.createElement('button');
        button.className = 'upgradeButton' + (level >= maxLevel ? ' maxed' : '');
        button.textContent = level >= maxLevel ? 'MAX LEVEL' : `Buy for ${cost} coins`;
        button.disabled = !canBuy;
        button.onclick = () => purchaseUpgrade(key);
        
        item.appendChild(upgradeName);
        item.appendChild(desc);
        item.appendChild(levelInfo);
        item.appendChild(button);
        
        categoryContainer.appendChild(item);
    });
    
    upgradesList.appendChild(categoryContainer);
}

// Show/Hide shop
function showShop() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('shopPanel').classList.remove('hidden');
    updateShopDisplay();
}

function hideShop() {
    document.getElementById('shopPanel').classList.add('hidden');
    if (!gameState.gameActive) {
        document.getElementById('startScreen').classList.remove('hidden');
    }
}

function playMusicNote() {
    if (!musicContext || !musicEnabled) return;

    const notes = [220, 277, 330, 277, 196, 247, 294, 247];
    const oscillator = musicContext.createOscillator();
    const gain = musicContext.createGain();
    const now = musicContext.currentTime;

    oscillator.type = 'square';
    oscillator.frequency.value = notes[Math.floor(now * 2) % notes.length];
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    oscillator.connect(gain);
    gain.connect(musicContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
}

function startMusic() {
    if (!musicEnabled) return;

    // Try to play selected track if available
    let audioElement = document.getElementById('bgMusic');
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'bgMusic';
        audioElement.loop = true;
        audioElement.volume = 0.3;
        document.body.appendChild(audioElement);
    }
    
    const track = MUSIC_TRACKS[gameState.currentMusicTrack];
    if (track) {
        audioElement.src = track.url;
        audioElement.play().catch(err => {
            // Fallback to synth if streaming fails
            console.log('Audio playback failed, using synth');
            startSynthMusic();
        });
    } else {
        startSynthMusic();
    }
    
    document.getElementById('musicBtn').textContent = '♫ Music On';
}

function startSynthMusic() {
    if (musicContext) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    musicContext = new AudioContext();
    musicContext.resume();
    playMusicNote();
    musicTimer = setInterval(playMusicNote, 250);
}

function stopMusic() {
    if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
    if (musicContext) {
        musicContext.close();
        musicContext = null;
    }
    const audioElement = document.getElementById('bgMusic');
    if (audioElement) {
        audioElement.pause();
    }
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    if (musicEnabled) {
        startMusic();
    } else {
        stopMusic();
    }
    document.getElementById('musicBtn').textContent = musicEnabled ? '♫ Music On' : '♫ Music Off';
}

// Change music track
function changeMusic(trackIndex) {
    gameState.currentMusicTrack = trackIndex;
    saveGame();
    if (musicEnabled) {
        stopMusic();
        startMusic();
    }
}

// Show music selection menu
function showMusicMenu() {
    const modal = document.createElement('div');
    modal.className = 'musicModal';
    modal.innerHTML = `
        <div class="musicMenuContent">
            <div class="modalHeader">
                <h2>🎵 Select Music Track</h2>
                <button class="closeBtn" onclick="this.closest('.musicModal').remove()">✕</button>
            </div>
            <div class="musicTracks">
                ${MUSIC_TRACKS.map((track, index) => `
                    <button class="musicTrack ${index === gameState.currentMusicTrack ? 'active' : ''}" 
                            onclick="changeMusic(${index}); document.querySelector('.musicModal').remove();">
                        <div class="trackName">${track.name}</div>
                        <div class="trackStatus">${index === gameState.currentMusicTrack ? '🎵 Now Playing' : 'Click to play'}</div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Game Engine
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer') || canvas;

function resizeGame() {
    const width = gameContainer.clientWidth || window.innerWidth;
    const height = gameContainer.clientHeight || window.innerHeight;
    CANVAS_WIDTH = width;
    CANVAS_HEIGHT = height;
    canvas.width = width;
    canvas.height = height;

    if (game) {
        game.car.y = Math.max(game.car.height / 2 + game.car.jumpHeight, Math.min(game.car.y, CANVAS_HEIGHT - game.car.height / 2));
        game.car.x = Math.max(ROAD_EDGE + game.car.width / 2, Math.min(game.car.x, CANVAS_WIDTH - ROAD_EDGE - game.car.width / 2));
        game.draw();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        gameContainer.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
}

function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.textContent = document.fullscreenElement ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
    }
}

class Car {
    constructor() {
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT - 100;
        this.width = 30;
        this.height = 50;
        this.vx = 0;
        this.speed = 4;
        this.angle = 0;
        this.isDrifting = false;
        this.driftAmount = 0;
        this.nitroActive = false;
        this.boosting = false;
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.baseY = this.y;
        this.hp = 1 + getUpgradeValue('shieldHP');
    }

    jump() {
        if (this.jumpHeight > 0) return false;

        this.jumpHeight = 1;
        this.jumpVelocity = 13;
        return true;
    }

    update(keys) {
        const maxSpeed = getUpgradeValue('speed');
        const acceleration = getUpgradeValue('acceleration');
        const handling = getUpgradeValue('handling');

        // Arrow keys and WASD provide the same controls.
        if (keys.arrowleft || keys.a) {
            this.angle -= handling;
        }
        if (keys.arrowright || keys.d) {
            this.angle += handling;
        }
        if (keys.arrowup || keys.w) {
            this.speed = Math.min(maxSpeed, this.speed + acceleration);
        }
        if (keys.arrowdown || keys.s) {
            this.speed = Math.max(1.5, this.speed - acceleration);
        }
        this.boosting = this.jumpHeight > 0;

        if (this.jumpHeight > 0) {
            this.jumpHeight += this.jumpVelocity;
            this.jumpVelocity -= 0.8;
            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.jumpVelocity = 0;
            }
        }

        // Speed moves the car in the direction it is facing across the screen.
        this.vx = Math.sin(this.angle) * this.speed;
        this.vy = -Math.cos(this.angle) * this.speed;

        // Drifting
        if (keys[' ']) {
            this.isDrifting = true;
            this.driftAmount = Math.min(this.driftAmount + 0.05, 1);
        } else {
            this.isDrifting = false;
            this.driftAmount *= 0.95;
        }

        // Position update
        this.x += this.vx;
        this.y += this.vy;

        // Keep the visible car body inside the road and screen.
        if (this.x < ROAD_EDGE + this.width / 2) this.x = ROAD_EDGE + this.width / 2;
        if (this.x > CANVAS_WIDTH - ROAD_EDGE - this.width / 2) this.x = CANVAS_WIDTH - ROAD_EDGE - this.width / 2;
        if (this.y - this.jumpHeight < this.height / 2) this.y = this.height / 2 + this.jumpHeight;
        if (this.y + this.height / 2 > CANVAS_HEIGHT) this.y = CANVAS_HEIGHT - this.height / 2;

        return true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y - this.jumpHeight);
        ctx.rotate(this.angle);

        // Car body
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Car windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(-this.width / 3, -this.height / 3, this.width * 0.66, this.height * 0.3);

        // Drift smoke effect
        if (this.isDrifting) {
            ctx.fillStyle = `rgba(255, 200, 0, ${0.3 * this.driftAmount})`;
            ctx.fillRect(-this.width / 2 - 10, this.height / 2 - 5, this.width + 20, 10);
        }

        if (this.boosting) {
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(-this.width / 2 - 4, this.height / 2, this.width + 8, 8);
        }

        ctx.restore();
    }
}

class Obstacle {
    constructor(x = Math.random() * (CANVAS_WIDTH - 60) + 30) {
        this.width = 60;
        this.height = 60;
        this.x = Math.max(ROAD_EDGE + this.width / 2, Math.min(CANVAS_WIDTH - ROAD_EDGE - this.width / 2, x));
        this.y = -50;
        this.vy = 3;
    }

    update(worldSpeed) {
        this.y += worldSpeed;
        return this.y < CANVAS_HEIGHT + 50;
    }

    draw() {
        const depth = 14;
        const left = this.x - this.width / 2;
        const right = this.x + this.width / 2;
        const bottom = this.y + this.height;

        // Extruded faces make obstacles read as raised blocks on the road.
        ctx.fillStyle = '#8f1f32';
        ctx.beginPath();
        ctx.moveTo(left, this.y);
        ctx.lineTo(right, this.y);
        ctx.lineTo(right + depth, this.y - depth);
        ctx.lineTo(left + depth, this.y - depth);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#a92836';
        ctx.beginPath();
        ctx.moveTo(right, this.y);
        ctx.lineTo(right + depth, this.y - depth);
        ctx.lineTo(right + depth, bottom - depth);
        ctx.lineTo(right, bottom);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FF4444';
        ctx.fillRect(left, this.y, this.width, this.height);
        
        // Pattern
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(this.x - this.width / 2 + 5, this.y + 5, 10, 10);
        ctx.fillRect(this.x - this.width / 2 + 40, this.y + 40, 10, 10);
    }

    collidesWith(car) {
        return car.jumpHeight === 0 && car.x - car.width / 2 < this.x + this.width / 2 &&
             car.x + car.width / 2 > this.x - this.width / 2 &&
             car.y - car.height / 2 < this.y + this.height &&
             car.y + car.height / 2 > this.y;
    }
}

class Coin {
    constructor(x = Math.random() * (CANVAS_WIDTH - ROAD_EDGE * 2) + ROAD_EDGE, y = -30, pathId = null, pathIndex = 0, route = 'straight') {
        this.x = x;
        this.y = y;
        this.pathId = pathId;
        this.pathIndex = pathIndex;
        this.route = route;
        this.radius = 8;
        this.vy = 2;
        this.rotation = 0;
    }

    update(worldSpeed) {
        this.y += worldSpeed;
        this.rotation += 0.1;
        return this.y < CANVAS_HEIGHT + 50;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Coin
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Coin center pattern
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(-3, -3, 6, 6);

        ctx.restore();
    }

    collidesWith(car) {
        const distance = Math.sqrt(
            Math.pow(this.x - car.x, 2) + Math.pow(this.y - car.y, 2)
        );
        return distance < this.radius + 20;
    }
}

class Game {
    constructor() {
        this.car = new Car();
        this.obstacles = [];
        this.coins = [];
        this.score = 0;
        this.multiplier = 1;
        this.driftScore = 0;
        this.keys = {};
        this.obstacleSpawnRate = 60;
        this.coinSpawnRate = 40;
        this.frameCount = 0;
        this.worldSpeed = 3;
        this.nitroXP = 0;
        this.nitroDuration = 0;
        this.nextCoinPathId = 1;

        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'shift', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            if (e.key.toLowerCase() === 'shift' && !this.keys.shift) {
                this.car.jump();
            }
            this.keys[e.key.toLowerCase()] = true;
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    activateNitro() {
        if (this.nitroXP < 100 || this.nitroDuration > 0) return;

        this.nitroXP = 0;
        this.nitroDuration = 180;
        this.car.nitroActive = true;
    }

    update() {
        if (this.keys[' '] || this.keys.space) {
            this.activateNitro();
        }

        if (!this.car.update(this.keys)) {
            return false;
        }

        // Spawn obstacles
        this.frameCount++;
        if (this.nitroDuration > 0) {
            this.nitroDuration--;
            if (this.nitroDuration === 0) this.car.nitroActive = false;
        }
        const nitroSpeed = this.car.nitroActive ? 6 : 0;
        this.worldSpeed = Math.min(14, this.car.speed + nitroSpeed + this.frameCount * 0.002);
        if (this.frameCount % this.obstacleSpawnRate === 0) {
            this.obstacles.push(new Obstacle());
        }

        // Each group gives a short route; some routes pass beside the next obstacle,
        // while others deliberately cross it and require a Shift speed boost.
        if (this.frameCount % this.coinSpawnRate === 0) {
            const pathLength = 3 + Math.floor(Math.random() * 6);
            const pathId = this.nextCoinPathId++;
            const route = pathId % 3 === 0 ? 'blocked' : pathId % 2 === 0 ? 'around' : 'straight';
            const laneWidth = CANVAS_WIDTH - ROAD_EDGE * 2 - 40;
            const startX = ROAD_EDGE + 20 + Math.random() * laneWidth;
            const stepX = route === 'around' ? (Math.random() < 0.5 ? -1 : 1) * 35 : (Math.random() - 0.5) * 18;
            for (let pathIndex = 0; pathIndex < pathLength; pathIndex++) {
                const x = Math.max(ROAD_EDGE + 20, Math.min(CANVAS_WIDTH - ROAD_EDGE - 20, startX + stepX * pathIndex));
                this.coins.push(new Coin(x, -30 - pathIndex * 48, pathId, pathIndex, route));
            }
            if (route !== 'straight') {
                const obstacleIndex = Math.floor(pathLength / 2);
                const obstacleX = route === 'around'
                    ? startX + stepX * obstacleIndex - stepX * 0.5
                    : startX + stepX * obstacleIndex;
                this.obstacles.push(new Obstacle(obstacleX));
            }
        }

        // Update obstacles
        this.obstacles = this.obstacles.filter(obs => obs.update(this.worldSpeed));

        // Check obstacle collisions
        for (let obs of this.obstacles) {
            if (obs.collidesWith(this.car)) {
                this.car.hp--;
                if (this.car.hp <= 0) {
                    return false;
                }
                this.obstacles = this.obstacles.filter(o => o !== obs);
            }
        }

        // Update coins
        this.coins = this.coins.filter(coin => coin.update(this.worldSpeed));

        // Check coin collection
        const magnetRange = getUpgradeValue('coinMagnet');
        for (let coin of this.coins) {
            const distance = Math.sqrt(
                Math.pow(coin.x - this.car.x, 2) + Math.pow(coin.y - this.car.y, 2)
            );

            if (distance < magnetRange) {
                // Attract coin to car
                coin.x += (this.car.x - coin.x) * 0.1;
                coin.y += (this.car.y - coin.y) * 0.1;
            }

            if (coin.collidesWith(this.car)) {
                gameState.coins += 1;
                this.nitroXP = Math.min(100, this.nitroXP + 10);
                this.coins = this.coins.filter(c => c !== coin);
                const coinValue = 10;
                this.score += coinValue * this.multiplier;
            }
        }

        // Update multiplier based on drift
        if (this.car.isDrifting) {
            this.driftScore += 1;
            this.multiplier = 1 + (this.driftScore / 100) * getUpgradeValue('driftBoost');
        } else {
            this.driftScore = Math.max(0, this.driftScore - 2);
            this.multiplier = Math.max(1, this.multiplier - 0.01);
        }

        // Speed increases difficulty as the run progresses.
        this.obstacleSpawnRate = Math.max(30, Math.floor(60 - this.worldSpeed * 2));

        // Increment score constantly
        this.score += this.multiplier * 0.1;

        return true;
    }

    draw() {
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Road
        ctx.fillStyle = '#2a2a4e';
        ctx.fillRect(50, 0, CANVAS_WIDTH - 100, CANVAS_HEIGHT);

        // Road lines
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        for (let i = 0; i < CANVAS_HEIGHT; i += 60) {
            ctx.beginPath();
            ctx.moveTo(CANVAS_WIDTH / 2, i);
            ctx.lineTo(CANVAS_WIDTH / 2, i + 30);
            ctx.stroke();
        }

        // Draw game objects
        this.obstacles.forEach(obs => obs.draw());
        this.coins.forEach(coin => coin.draw());
        this.car.draw();

        // Draw HUD
        this.drawHUD();
    }

    drawHUD() {
        // Stats are handled by HTML UI - just update values
        document.getElementById('coinsDisplay').textContent = gameState.coins;
        document.getElementById('scoreDisplay').textContent = Math.floor(this.score);
        document.getElementById('multiplierDisplay').textContent = 
            this.multiplier.toFixed(1) + 'x';
        const speedDisplay = document.getElementById('speedDisplay');
        const nitroXP = document.getElementById('nitroXP');
        const nitroFill = document.getElementById('nitroFill');
        const nitroStatus = document.getElementById('nitroStatus');
        if (speedDisplay) speedDisplay.textContent = `${this.worldSpeed.toFixed(1)}`;
        if (nitroXP) nitroXP.textContent = `${this.nitroXP}/100 XP`;
        if (nitroFill) nitroFill.style.width = `${this.nitroXP}%`;
        if (nitroStatus) {
            nitroStatus.textContent = this.car.nitroActive
                ? 'NITRO ACTIVE'
                : this.nitroXP >= 100 ? 'READY - SPACE' : 'COLLECT COINS';
        }
    }

    restart() {
        saveGame();
        this.car = new Car();
        this.obstacles = [];
        this.coins = [];
        this.score = 0;
        this.multiplier = 1;
        this.driftScore = 0;
        this.frameCount = 0;
        this.worldSpeed = 3;
        this.nitroXP = 0;
        this.nitroDuration = 0;
        this.car.nitroActive = false;
        gameState.gameActive = true;
        document.getElementById('gameOver').classList.add('hidden');
        gameLoop();
    }
}

let game = null;

function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('shopPanel').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    const startTitle = document.getElementById('startTitle');
    if (startTitle) startTitle.textContent = '🏎️ Drift Master';
    gameState.gameActive = true;
    game = new Game();
    startMusic();
    game.draw();
    gameLoop();
}

function gameLoop() {
    if (!game.update()) {
        endGame();
        return;
    }

    game.draw();

    if (gameState.gameActive) {
        requestAnimationFrame(gameLoop);
    }
}

function endGame() {
    gameState.gameActive = false;
    stopMusic();
    saveGame();

    const gameOverScreen = document.getElementById('gameOver');
    const stats = document.getElementById('gameOverStats');
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('startTitle').textContent = 'You Crashed!';

    stats.innerHTML = `
        <div>
            <span>Final Score:</span>
            <span>${Math.floor(game.score)}</span>
        </div>
        <div>
            <span>Coins Earned:</span>
            <span>${gameState.coins}</span>
        </div>
        <div>
            <span>Max Multiplier:</span>
            <span>${game.multiplier.toFixed(1)}x</span>
        </div>
    `;

    gameOverScreen.classList.remove('hidden');
}

// Handle window resize
window.addEventListener('resize', resizeGame);
document.addEventListener('fullscreenchange', () => {
    updateFullscreenButton();
    resizeGame();
});

// Initialize
resizeGame();
loadGame();
updateShopDisplay();
updateFullscreenButton();
