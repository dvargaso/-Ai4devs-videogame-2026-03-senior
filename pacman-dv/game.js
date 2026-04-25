const {
  GRID_SIZE,
  CELL_SIZE,
  DIRECTIONS,
  hasEdgeDoor,
  hasVerticalWall,
  hasHorizontalWall,
  getNextCell,
  chooseMovementDirection,
  getCellCenter,
  getAllCells
} = PacmanMazeRules;

const {
  POWER_MODE_DURATION,
  STARTING_LIVES,
  createDotCells,
  collectDot,
  getRemainingDots,
  isLevelWon,
  addDotScore,
  loseLife,
  isGameOver,
  getNextLevel,
  isFinalLevel,
  getGhostSpeed,
  collectPowerPellet,
  updatePowerModeTime,
  isPowerModeActive: hasActivePowerMode,
  chooseGhostDirection: chooseGhostRuleDirection,
  getGhostContactAction,
  CONTACT_ACTIONS
} = PacmanGameRules;

const GRID_WIDTH = GRID_SIZE * CELL_SIZE;
const GRID_HEIGHT = GRID_SIZE * CELL_SIZE;
const GAME_WIDTH = GRID_WIDTH;
const GAME_HEIGHT = GRID_HEIGHT;
const PACMAN_SPEED = 160;
const PACMAN_RADIUS = 18;
const GHOST_RADIUS = 17;
const DOT_RADIUS = 3;
const POWER_PELLET_RADIUS = 8;
const MOUTH_ANIMATION_SPEED = 0.008;
const MAX_MOUTH_OPENING = 0.75;
const GAME_CONFIG = {
  baseGhostSpeed: 131.25,
  powerBlinkInterval: 180,
  musicVolume: 0.04,
  musicStepMs: 220,
  powerMusicStepMs: 155
};
const WALL_THICKNESS = 6;
const WALL_COLOR = 0x163cff;
const PATH_COLOR = 0x050505;
const DOT_COLOR = 0xffe3b0;
const POWER_PELLET_COLOR = 0xfff6a0;
const VULNERABLE_GHOST_COLOR = 0x243dff;
const VULNERABLE_GHOST_BLINK_COLOR = 0xffffff;
const MUSIC_NOTES = [
  261.63,
  329.63,
  392.00,
  329.63,
  293.66,
  369.99,
  440.00,
  369.99
];
const GHOST_SPAWNS = [
  { row: 8, col: 8, color: 0xff2f7d },
  { row: 1, col: 8, color: 0x00d7ff },
  { row: 8, col: 1, color: 0xff9f1c }
];
const POWER_PELLET_CELLS = [
  { row: 0, col: 1 },
  { row: 0, col: 8 },
  { row: 4, col: 4 },
  { row: 5, col: 9 },
  { row: 9, col: 1 },
  { row: 9, col: 8 }
];

let pacman;
let ghosts = [];
let dots = [];
let powerPellets = [];
let mazeGraphics;
let cursors;
let scoreText;
let remainingDotsText;
let livesText;
let levelText;
let statusText;
let audioContext = null;
let musicGain = null;
let musicStepIndex = 0;
let mouthTime = 0;
let powerModeTimeRemaining = 0;
let score = 0;
let lives = STARTING_LIVES;
let level = 1;
let currentDirection = 0;
let gridPosition = { row: 1, col: 1 };
let requestedDirection = DIRECTIONS.none;
let movementDirection = DIRECTIONS.none;
let targetCell = null;
let isCaught = false;
let levelWon = false;
let finalWin = false;

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
  this.input.keyboard.once('keydown', startMusic);
  this.input.once('pointerdown', startMusic);
  scoreText = document.getElementById('score-counter');
  remainingDotsText = document.getElementById('dots-left-counter');
  livesText = document.getElementById('lives-counter');
  levelText = document.getElementById('level-counter');
  mazeGraphics = this.add.graphics();
  drawMaze();

  dots = createDotCells(getAllCells(), getExcludedDotCells())
    .map((cell) => createDot(this, cell));
  powerPellets = POWER_PELLET_CELLS.map((cell) => createPowerPellet(this, cell));

  pacman = this.add.graphics();
  placePacmanAtCell(gridPosition);

  ghosts = GHOST_SPAWNS.map((spawn) => createGhost(this, spawn));
  updateHud();
  statusText = this.add.text(GRID_WIDTH / 2, GRID_HEIGHT / 2, '', {
    fontFamily: 'Arial',
    fontSize: '36px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5);

  drawPacman(0);
}

function update(time, delta) {
  if (isCaught || levelWon || finalWin) {
    return;
  }

  updatePowerMode(delta);
  updateRequestedDirection();

  if (!targetCell) {
    chooseNextCell();
  }

  if (targetCell) {
    movePacmanTowardTarget(delta);
  }


  mouthTime += delta;
  const mouthOpening = getMouthOpening();
  drawPacman(mouthOpening);

  checkDotContact();
  checkPowerPelletContact();
  updateGhosts(delta);
  updateGhostVisuals(time);
  checkGhostContact();
}

function updateRequestedDirection() {
  if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
    requestedDirection = DIRECTIONS.left;
  } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
    requestedDirection = DIRECTIONS.right;
  } else if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
    requestedDirection = DIRECTIONS.up;
  } else if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
    requestedDirection = DIRECTIONS.down;
  }
}

function chooseNextCell() {
  movementDirection = chooseMovementDirection(gridPosition, movementDirection, requestedDirection);

  if (movementDirection === DIRECTIONS.none) {
    return;
  }

  currentDirection = movementDirection.angle;
  targetCell = getNextCell(gridPosition, movementDirection);

  if (targetCell.isWrapped) {
    gridPosition = { row: targetCell.row, col: targetCell.col };
    placePacmanAtCell(gridPosition);
    targetCell = null;
  }
}

function movePacmanTowardTarget(delta) {
  const targetPixel = getCellCenter(targetCell.row, targetCell.col);
  const distanceThisFrame = PACMAN_SPEED * (delta / 1000);
  const distanceToTarget = Phaser.Math.Distance.Between(
    pacman.x,
    pacman.y,
    targetPixel.x,
    targetPixel.y
  );

  if (distanceThisFrame >= distanceToTarget) {
    gridPosition = { row: targetCell.row, col: targetCell.col };
    placePacmanAtCell(gridPosition);
    targetCell = null;
    return;
  }

  pacman.x += movementDirection.col * distanceThisFrame;
  pacman.y += movementDirection.row * distanceThisFrame;
}

function placePacmanAtCell(cell) {
  const center = getCellCenter(cell.row, cell.col);
  pacman.x = center.x;
  pacman.y = center.y;
}

function drawMaze() {
  mazeGraphics.clear();
  mazeGraphics.fillStyle(PATH_COLOR);
  mazeGraphics.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

  drawOuterWalls();
  drawInteriorWalls();
}

function drawOuterWalls() {
  mazeGraphics.fillStyle(WALL_COLOR);

  for (let col = 0; col < GRID_SIZE; col += 1) {
    if (!hasEdgeDoor('top', col)) {
      mazeGraphics.fillRect(col * CELL_SIZE, 0, CELL_SIZE, WALL_THICKNESS);
    }

    if (!hasEdgeDoor('bottom', col)) {
      mazeGraphics.fillRect(col * CELL_SIZE, GRID_HEIGHT - WALL_THICKNESS, CELL_SIZE, WALL_THICKNESS);
    }
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    if (!hasEdgeDoor('left', row)) {
      mazeGraphics.fillRect(0, row * CELL_SIZE, WALL_THICKNESS, CELL_SIZE);
    }

    if (!hasEdgeDoor('right', row)) {
      mazeGraphics.fillRect(GAME_WIDTH - WALL_THICKNESS, row * CELL_SIZE, WALL_THICKNESS, CELL_SIZE);
    }
  }
}

function drawInteriorWalls() {
  mazeGraphics.fillStyle(WALL_COLOR);

  for (let col = 1; col < GRID_SIZE; col += 1) {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      if (hasVerticalWall(row, col)) {
        mazeGraphics.fillRect(
          col * CELL_SIZE - WALL_THICKNESS / 2,
          row * CELL_SIZE,
          WALL_THICKNESS,
          CELL_SIZE
        );
      }
    }
  }

  for (let row = 1; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (hasHorizontalWall(row, col)) {
        mazeGraphics.fillRect(
          col * CELL_SIZE,
          row * CELL_SIZE - WALL_THICKNESS / 2,
          CELL_SIZE,
          WALL_THICKNESS
        );
      }
    }
  }
}

function getExcludedDotCells() {
  return POWER_PELLET_CELLS;
}

function createDot(scene, cell) {
  const dot = {
    graphics: scene.add.graphics(),
    row: cell.row,
    col: cell.col,
    eaten: false
  };
  const center = getCellCenter(cell.row, cell.col);

  dot.graphics.x = center.x;
  dot.graphics.y = center.y;
  dot.graphics.fillStyle(DOT_COLOR);
  dot.graphics.fillCircle(0, 0, DOT_RADIUS);

  return dot;
}

function checkDotContact() {
  const dot = collectDot(dots, gridPosition);

  if (!dot) {
    return;
  }

  dot.graphics.setVisible(false);
  score = addDotScore(score);
  updateHud();

  if (isLevelWon(dots)) {
    winLevel();
  }
}

function updateHud() {
  scoreText.textContent = `Score: ${score}`;
  remainingDotsText.textContent = `Dots left: ${getRemainingDots(dots)}`;
  livesText.textContent = `Lives: ${lives}`;
  levelText.textContent = `Level: ${level}`;
}

function winLevel() {
  if (isFinalLevel(level)) {
    finalWin = true;
    movementDirection = DIRECTIONS.none;
    targetCell = null;
    statusText.setText('YOU WIN!');
    return;
  }

  levelWon = true;
  level = getNextLevel(level);
  resetLevelState();
  statusText.setText(`LEVEL ${level}`);
}

function createPowerPellet(scene, cell) {
  const pellet = {
    graphics: scene.add.graphics(),
    row: cell.row,
    col: cell.col,
    eaten: false
  };
  const center = getCellCenter(cell.row, cell.col);

  pellet.graphics.x = center.x;
  pellet.graphics.y = center.y;
  pellet.graphics.fillStyle(POWER_PELLET_COLOR);
  pellet.graphics.fillCircle(0, 0, POWER_PELLET_RADIUS);

  return pellet;
}

function checkPowerPelletContact() {
  const pellet = collectPowerPellet(powerPellets, gridPosition);

  if (!pellet) {
    return;
  }

  pellet.graphics.setVisible(false);
  activatePowerMode();
}

function activatePowerMode() {
  powerModeTimeRemaining = POWER_MODE_DURATION;
  statusText.setText('POWER!');
  ghosts.forEach((ghost) => drawGhost(ghost));
}

function updatePowerMode(delta) {
  if (powerModeTimeRemaining <= 0) {
    return;
  }

  powerModeTimeRemaining = updatePowerModeTime(powerModeTimeRemaining, delta);

  if (powerModeTimeRemaining === 0) {
    statusText.setText('');
    ghosts.forEach((ghost) => drawGhost(ghost));
  }
}

function createGhost(scene, spawn) {
  const ghost = {
    graphics: scene.add.graphics(),
    color: spawn.color,
    gridPosition: { row: spawn.row, col: spawn.col },
    movementDirection: DIRECTIONS.none,
    targetCell: null,
    isAlive: true
  };

  placeGhostAtCell(ghost, ghost.gridPosition);
  drawGhost(ghost);

  return ghost;
}

function updateGhosts(delta) {
  ghosts.forEach((ghost) => {
    if (!ghost.isAlive) {
      return;
    }

    if (!ghost.targetCell) {
      chooseGhostNextCell(ghost);
    }

    if (ghost.targetCell) {
      moveGhostTowardTarget(ghost, delta);
    }
  });
}

function chooseGhostNextCell(ghost) {
  const direction = chooseGhostDirection(ghost);

  if (direction === DIRECTIONS.none) {
    return;
  }

  ghost.movementDirection = direction;
  ghost.targetCell = getNextCell(ghost.gridPosition, direction);

  if (ghost.targetCell.isWrapped) {
    ghost.gridPosition = { row: ghost.targetCell.row, col: ghost.targetCell.col };
    placeGhostAtCell(ghost, ghost.gridPosition);
    ghost.targetCell = null;
  }
}

function chooseGhostDirection(ghost) {
  return chooseGhostRuleDirection(ghost, gridPosition, isPowerModeActive());
}

function moveGhostTowardTarget(ghost, delta) {
  const targetPixel = getCellCenter(ghost.targetCell.row, ghost.targetCell.col);
  const distanceThisFrame = getGhostSpeed(GAME_CONFIG.baseGhostSpeed, level) * (delta / 1000);
  const distanceToTarget = Phaser.Math.Distance.Between(
    ghost.graphics.x,
    ghost.graphics.y,
    targetPixel.x,
    targetPixel.y
  );

  if (distanceThisFrame >= distanceToTarget) {
    ghost.gridPosition = { row: ghost.targetCell.row, col: ghost.targetCell.col };
    placeGhostAtCell(ghost, ghost.gridPosition);
    ghost.targetCell = null;
    return;
  }

  ghost.graphics.x += ghost.movementDirection.col * distanceThisFrame;
  ghost.graphics.y += ghost.movementDirection.row * distanceThisFrame;
}

function placeGhostAtCell(ghost, cell) {
  const center = getCellCenter(cell.row, cell.col);
  ghost.graphics.x = center.x;
  ghost.graphics.y = center.y;
}

function drawGhost(ghost) {
  if (!ghost.isAlive) {
    ghost.graphics.setVisible(false);
    return;
  }

  ghost.graphics.setVisible(true);
  ghost.graphics.clear();
  ghost.graphics.fillStyle(getGhostColor(ghost));
  ghost.graphics.fillCircle(0, -3, GHOST_RADIUS);
  ghost.graphics.fillRect(-GHOST_RADIUS, -3, GHOST_RADIUS * 2, GHOST_RADIUS + 8);

  for (let index = 0; index < 3; index += 1) {
    ghost.graphics.fillTriangle(
      -GHOST_RADIUS + index * 12,
      GHOST_RADIUS + 5,
      -GHOST_RADIUS + index * 12 + 6,
      GHOST_RADIUS + 14,
      -GHOST_RADIUS + index * 12 + 12,
      GHOST_RADIUS + 5
    );
  }

  ghost.graphics.fillStyle(0xffffff);
  ghost.graphics.fillCircle(-6, -5, 4);
  ghost.graphics.fillCircle(6, -5, 4);
}

function updateGhostVisuals(time) {
  if (!isPowerModeActive()) {
    return;
  }

  ghosts.forEach((ghost) => {
    ghost.blinkOn = Math.floor(time / GAME_CONFIG.powerBlinkInterval) % 2 === 0;
    drawGhost(ghost);
  });
}

function getGhostColor(ghost) {
  if (!isPowerModeActive()) {
    return ghost.color;
  }

  return ghost.blinkOn ? VULNERABLE_GHOST_BLINK_COLOR : VULNERABLE_GHOST_COLOR;
}

function checkGhostContact() {
  const contactAction = getGhostContactAction(ghosts, gridPosition, isPowerModeActive());

  if (contactAction.type === CONTACT_ACTIONS.none) {
    return;
  }

  if (contactAction.type === CONTACT_ACTIONS.kill) {
    killGhost(contactAction.ghost);
    return;
  }

  isCaught = true;
  lives = loseLife(lives);
  updateHud();

  if (isGameOver(lives)) {
    resetFullGame();
    statusText.setText('GAME OVER - RESTART');
    return;
  }

  resetPositionsAfterLifeLoss();
  statusText.setText('LIFE LOST');
}

function killGhost(ghost) {
  ghost.isAlive = false;
  ghost.targetCell = null;
  ghost.movementDirection = DIRECTIONS.none;
  ghost.graphics.setVisible(false);
}

function isPowerModeActive() {
  return hasActivePowerMode(powerModeTimeRemaining);
}

function resetPositionsAfterLifeLoss() {
  isCaught = false;
  gridPosition = { row: 1, col: 1 };
  requestedDirection = DIRECTIONS.none;
  movementDirection = DIRECTIONS.none;
  targetCell = null;
  currentDirection = 0;
  powerModeTimeRemaining = 0;
  placePacmanAtCell(gridPosition);
  ghosts.forEach((ghost, index) => {
    if (!ghost.isAlive) {
      return;
    }

    resetGhostToSpawn(ghost, GHOST_SPAWNS[index]);
    drawGhost(ghost);
  });
  drawPacman(0);
}

function resetLevelState() {
  gridPosition = { row: 1, col: 1 };
  requestedDirection = DIRECTIONS.none;
  movementDirection = DIRECTIONS.none;
  targetCell = null;
  currentDirection = 0;
  powerModeTimeRemaining = 0;
  isCaught = false;
  levelWon = false;
  finalWin = false;
  resetDots();
  resetPowerPellets();
  resetGhosts();
  placePacmanAtCell(gridPosition);
  drawPacman(0);
  updateHud();
}

function resetFullGame() {
  score = 0;
  lives = STARTING_LIVES;
  level = 1;
  resetLevelState();
}

function resetDots() {
  dots.forEach((dot) => {
    dot.eaten = false;
    dot.graphics.setVisible(true);
  });
}

function resetPowerPellets() {
  powerPellets.forEach((pellet) => {
    pellet.eaten = false;
    pellet.graphics.setVisible(true);
  });
}

function resetGhosts() {
  ghosts.forEach((ghost, index) => {
    ghost.isAlive = true;
    resetGhostToSpawn(ghost, GHOST_SPAWNS[index]);
    drawGhost(ghost);
  });
}

function resetGhostToSpawn(ghost, spawn) {
  ghost.gridPosition = { row: spawn.row, col: spawn.col };
  ghost.movementDirection = DIRECTIONS.none;
  ghost.targetCell = null;
  placeGhostAtCell(ghost, ghost.gridPosition);
}

function startMusic() {
  if (audioContext) {
    return;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    return;
  }

  audioContext = new AudioContextConstructor();
  musicGain = audioContext.createGain();
  musicGain.gain.value = GAME_CONFIG.musicVolume;
  musicGain.connect(audioContext.destination);
  scheduleNextMusicStep();
}

function scheduleNextMusicStep() {
  if (!audioContext || !musicGain) {
    return;
  }

  playMusicNote(MUSIC_NOTES[musicStepIndex % MUSIC_NOTES.length]);
  musicStepIndex += 1;
  window.setTimeout(
    scheduleNextMusicStep,
    isPowerModeActive() ? GAME_CONFIG.powerMusicStepMs : GAME_CONFIG.musicStepMs
  );
}

function playMusicNote(frequency) {
  const oscillator = audioContext.createOscillator();
  const noteGain = audioContext.createGain();
  const startTime = audioContext.currentTime;
  const duration = isPowerModeActive() ? 0.09 : 0.12;

  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  noteGain.gain.setValueAtTime(0.0001, startTime);
  noteGain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(noteGain);
  noteGain.connect(musicGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
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
