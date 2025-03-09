// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const ROCKET_WIDTH = 50;
const ROCKET_HEIGHT = 30;
const GRAVITY = 0.4;
const THRUST = -8;
const WORMHOLE_WIDTH = 80;
const WORMHOLE_GAP = 180;
const WORMHOLE_SPEED = 2;
const WORMHOLE_SPAWN_RATE = 1800; // milliseconds
const STAR_COUNT = 200;

// Game variables
let canvas, ctx;
let rocket = {
    x: CANVAS_WIDTH / 4,
    y: CANVAS_HEIGHT / 2,
    width: ROCKET_WIDTH,
    height: ROCKET_HEIGHT,
    velocity: 0,
    rotation: 0
};
let wormholes = [];
let stars = [];
let gameActive = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let frameCount = 0;
let lastWormholeTime = 0;
let gameOverlay;
let isTouching = false; // Track if user is touching the screen

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size based on device
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create game over overlay
    gameOverlay = document.createElement('div');
    gameOverlay.className = 'game-over';
    gameOverlay.innerHTML = '<h2>MISSION FAILED</h2><p>Your rocket was lost in space!</p>';
    document.querySelector('.game-container').appendChild(gameOverlay);
    
    // Initialize stars
    createStars();
    
    // Set high score
    highScoreElement.textContent = highScore;
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Touch event listeners for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchstart', handleTouchStartDocument);
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    
    // Start animation loop
    requestAnimationFrame(gameLoop);
}

// Resize canvas based on window size
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth - 40; // Account for padding
    
    if (window.innerWidth <= 768) {
        // Mobile device
        canvas.width = containerWidth;
        canvas.height = containerWidth * (CANVAS_HEIGHT / CANVAS_WIDTH);
    } else {
        // Desktop
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }
}

// Create stars for background
function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            brightness: Math.random() * 70 + 30
        });
    }
}

// Handle key down events
function handleKeyDown(e) {
    if (e.code === 'Space' && gameActive) {
        rocket.velocity = THRUST;
        rocket.rotation = -20;
    }
    
    // Start game with spacebar
    if (e.code === 'Space' && !gameActive && !gameOver) {
        startGame();
    }
    
    // Restart game with spacebar when game over
    if (e.code === 'Space' && gameOver) {
        restartGame();
    }
}

// Handle key up events
function handleKeyUp(e) {
    if (e.code === 'Space') {
        rocket.rotation = 0;
    }
}

// Handle touch start on canvas
function handleTouchStart(e) {
    e.preventDefault(); // Prevent scrolling when touching the canvas
    
    if (gameActive) {
        rocket.velocity = THRUST;
        rocket.rotation = -20;
        isTouching = true;
    }
}

// Handle touch end on canvas
function handleTouchEnd(e) {
    e.preventDefault();
    rocket.rotation = 0;
    isTouching = false;
}

// Handle touch start on document (for game start/restart)
function handleTouchStartDocument(e) {
    // Start game with touch if not active and not game over
    if (!gameActive && !gameOver) {
        startGame();
    }
    
    // Restart game with touch when game over
    if (gameOver) {
        restartGame();
    }
}

// Start the game
function startGame() {
    gameActive = true;
    gameOver = false;
    score = 0;
    scoreElement.textContent = score;
    wormholes = [];
    rocket.y = CANVAS_HEIGHT / 2;
    rocket.velocity = 0;
    rocket.rotation = 0;
    lastWormholeTime = Date.now();
    
    startButton.style.display = 'none';
    restartButton.style.display = 'none';
    gameOverlay.classList.remove('visible');
}

// Restart the game
function restartGame() {
    startGame();
}

// End the game
function endGame() {
    gameActive = false;
    gameOver = true;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    restartButton.style.display = 'block';
    gameOverlay.classList.add('visible');
}

// Create a new wormhole
function createWormhole() {
    const gapPosition = Math.random() * (CANVAS_HEIGHT - WORMHOLE_GAP - 100) + 50;
    
    wormholes.push({
        x: CANVAS_WIDTH,
        gapTop: gapPosition,
        gapBottom: gapPosition + WORMHOLE_GAP,
        passed: false,
        pulsePhase: 0
    });
    
    lastWormholeTime = Date.now();
}

// Update game state
function update() {
    if (!gameActive) return;
    
    frameCount++;
    
    // Update rocket
    rocket.velocity += GRAVITY;
    rocket.y += rocket.velocity;
    
    // Gradually return rotation to normal
    if (rocket.rotation < 0) {
        rocket.rotation += 1;
    } else if (rocket.rotation > 0) {
        rocket.rotation -= 1;
    }
    
    // Check for collisions with canvas boundaries
    if (rocket.y < 0) {
        rocket.y = 0;
        rocket.velocity = 0;
    } else if (rocket.y + rocket.height > CANVAS_HEIGHT) {
        endGame();
    }
    
    // Update stars
    stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
            star.x = CANVAS_WIDTH;
            star.y = Math.random() * CANVAS_HEIGHT;
        }
    });
    
    // Create new wormholes
    if (Date.now() - lastWormholeTime > WORMHOLE_SPAWN_RATE) {
        createWormhole();
    }
    
    // Update wormholes
    for (let i = wormholes.length - 1; i >= 0; i--) {
        const wormhole = wormholes[i];
        wormhole.x -= WORMHOLE_SPEED;
        wormhole.pulsePhase += 0.02;
        
        // Check if rocket passed wormhole
        if (!wormhole.passed && rocket.x > wormhole.x + WORMHOLE_WIDTH) {
            wormhole.passed = true;
            score++;
            scoreElement.textContent = score;
        }
        
        // Check for collisions with wormhole
        if (
            rocket.x + rocket.width > wormhole.x && 
            rocket.x < wormhole.x + WORMHOLE_WIDTH
        ) {
            if (
                rocket.y < wormhole.gapTop || 
                rocket.y + rocket.height > wormhole.gapBottom
            ) {
                endGame();
            }
        }
        
        // Remove wormholes that are off-screen
        if (wormhole.x + WORMHOLE_WIDTH < 0) {
            wormholes.splice(i, 1);
        }
    }
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw stars
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, ${star.brightness}%, ${Math.random() * 0.2 + 0.8})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw wormholes
    wormholes.forEach(wormhole => {
        // Calculate pulse effect
        const pulseSize = Math.sin(wormhole.pulsePhase) * 5;
        const glowIntensity = Math.abs(Math.sin(wormhole.pulsePhase)) * 20 + 10;
        
        // Top wormhole
        const gradient1 = ctx.createLinearGradient(
            wormhole.x, 0, 
            wormhole.x + WORMHOLE_WIDTH, 0
        );
        gradient1.addColorStop(0, `rgba(100, 100, 255, 0.1)`);
        gradient1.addColorStop(0.5, `rgba(150, 150, 255, 0.7)`);
        gradient1.addColorStop(1, `rgba(100, 100, 255, 0.1)`);
        
        ctx.fillStyle = gradient1;
        ctx.fillRect(
            wormhole.x - pulseSize, 
            0, 
            WORMHOLE_WIDTH + pulseSize * 2, 
            wormhole.gapTop
        );
        
        // Bottom wormhole
        const gradient2 = ctx.createLinearGradient(
            wormhole.x, CANVAS_HEIGHT, 
            wormhole.x + WORMHOLE_WIDTH, CANVAS_HEIGHT
        );
        gradient2.addColorStop(0, `rgba(100, 100, 255, 0.1)`);
        gradient2.addColorStop(0.5, `rgba(150, 150, 255, 0.7)`);
        gradient2.addColorStop(1, `rgba(100, 100, 255, 0.1)`);
        
        ctx.fillStyle = gradient2;
        ctx.fillRect(
            wormhole.x - pulseSize, 
            wormhole.gapBottom, 
            WORMHOLE_WIDTH + pulseSize * 2, 
            CANVAS_HEIGHT - wormhole.gapBottom
        );
        
        // Glow effect
        ctx.strokeStyle = `rgba(150, 150, 255, ${glowIntensity / 100})`;
        ctx.lineWidth = 2;
        
        // Top edge glow
        ctx.beginPath();
        ctx.moveTo(wormhole.x - pulseSize, wormhole.gapTop);
        ctx.lineTo(wormhole.x + WORMHOLE_WIDTH + pulseSize, wormhole.gapTop);
        ctx.stroke();
        
        // Bottom edge glow
        ctx.beginPath();
        ctx.moveTo(wormhole.x - pulseSize, wormhole.gapBottom);
        ctx.lineTo(wormhole.x + WORMHOLE_WIDTH + pulseSize, wormhole.gapBottom);
        ctx.stroke();
    });
    
    // Draw rocket
    ctx.save();
    ctx.translate(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2);
    ctx.rotate(rocket.rotation * Math.PI / 180);
    
    // Rocket body
    const rocketGradient = ctx.createLinearGradient(
        -rocket.width / 2, 0, 
        rocket.width / 2, 0
    );
    rocketGradient.addColorStop(0, '#ff3333');
    rocketGradient.addColorStop(0.7, '#ff9966');
    rocketGradient.addColorStop(1, '#ffcc99');
    
    ctx.fillStyle = rocketGradient;
    ctx.beginPath();
    ctx.moveTo(rocket.width / 2, 0);
    ctx.lineTo(-rocket.width / 2, -rocket.height / 2);
    ctx.lineTo(-rocket.width / 2, rocket.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Rocket window
    ctx.fillStyle = '#99ccff';
    ctx.beginPath();
    ctx.arc(-rocket.width / 6, 0, rocket.height / 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Rocket flames (when thrusting)
    if (rocket.velocity < 0) {
        const flameLength = Math.random() * 20 + 20;
        
        const flameGradient = ctx.createLinearGradient(
            -rocket.width / 2, 0, 
            -rocket.width / 2 - flameLength, 0
        );
        flameGradient.addColorStop(0, '#ffcc00');
        flameGradient.addColorStop(0.5, '#ff6600');
        flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.moveTo(-rocket.width / 2, -rocket.height / 4);
        ctx.lineTo(-rocket.width / 2 - flameLength, 0);
        ctx.lineTo(-rocket.width / 2, rocket.height / 4);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
    
    // Draw game state message
    if (!gameActive && !gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize the game when the page loads
window.addEventListener('load', init); 