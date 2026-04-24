const GAME_WIDTH = 500;
const GAME_HEIGHT = 500;
const PACMAN_SPEED = 180;
const PACMAN_RADIUS = 22;
const MOUTH_ANIMATION_SPEED = 0.008;
const MAX_MOUTH_OPENING = 0.75;

let pacman;
let cursors;
let mouthTime = 0;
let currentDirection = 0;
let movementDirection = { x: 0, y: 0 };

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#050505',
  scene: {
    create,
    update
  }
};

new Phaser.Game(config);

function create() {
  cursors = this.input.keyboard.createCursorKeys();

  pacman = this.add.graphics();
  pacman.x = GAME_WIDTH / 2;
  pacman.y = GAME_HEIGHT / 2;

  drawPacman(0);
}

function update(time, delta) {
  updateMovementDirection();

  pacman.x += movementDirection.x * PACMAN_SPEED * (delta / 1000);
  pacman.y += movementDirection.y * PACMAN_SPEED * (delta / 1000);

  wrapPacmanAroundCanvas();

  mouthTime += delta;
  const mouthOpening = getMouthOpening();
  drawPacman(mouthOpening);
}

function updateMovementDirection() {
  if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
    setMovementDirection(-1, 0);
  } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
    setMovementDirection(1, 0);
  } else if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
    setMovementDirection(0, -1);
  } else if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
    setMovementDirection(0, 1);
  }
}

function setMovementDirection(x, y) {
  movementDirection = { x, y };
  currentDirection = Math.atan2(y, x);
}

function wrapPacmanAroundCanvas() {
  if (pacman.x < -PACMAN_RADIUS) {
    pacman.x = GAME_WIDTH + PACMAN_RADIUS;
  } else if (pacman.x > GAME_WIDTH + PACMAN_RADIUS) {
    pacman.x = -PACMAN_RADIUS;
  }

  if (pacman.y < -PACMAN_RADIUS) {
    pacman.y = GAME_HEIGHT + PACMAN_RADIUS;
  } else if (pacman.y > GAME_HEIGHT + PACMAN_RADIUS) {
    pacman.y = -PACMAN_RADIUS;
  }
}

function getMouthOpening() {
  const animationValue = Math.abs(Math.sin(mouthTime * MOUTH_ANIMATION_SPEED));
  return animationValue * MAX_MOUTH_OPENING;
}

function drawPacman(mouthOpening) {
  pacman.clear();
  pacman.fillStyle(0xffdd00);
  pacman.slice(
    0,
    0,
    PACMAN_RADIUS,
    currentDirection + mouthOpening,
    currentDirection + Math.PI * 2 - mouthOpening,
    false
  );
  pacman.fillPath();
}
