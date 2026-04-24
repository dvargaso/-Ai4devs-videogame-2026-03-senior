const {
  GRID_SIZE,
  CELL_SIZE,
  DIRECTIONS,
  hasEdgeDoor,
  hasVerticalWall,
  hasHorizontalWall,
  getNextCell,
  chooseMovementDirection,
  getCellCenter
} = PacmanMazeRules;

const GAME_WIDTH = GRID_SIZE * CELL_SIZE;
const GAME_HEIGHT = GRID_SIZE * CELL_SIZE;
const PACMAN_SPEED = 160;
const PACMAN_RADIUS = 18;
const MOUTH_ANIMATION_SPEED = 0.008;
const MAX_MOUTH_OPENING = 0.75;
const WALL_THICKNESS = 6;
const WALL_COLOR = 0x163cff;
const PATH_COLOR = 0x050505;

let pacman;
let mazeGraphics;
let cursors;
let mouthTime = 0;
let currentDirection = 0;
let gridPosition = { row: 1, col: 1 };
let requestedDirection = DIRECTIONS.none;
let movementDirection = DIRECTIONS.none;
let targetCell = null;

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
  mazeGraphics = this.add.graphics();
  drawMaze();

  pacman = this.add.graphics();
  placePacmanAtCell(gridPosition);

  drawPacman(0);
}

function update(time, delta) {
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
  mazeGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

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
      mazeGraphics.fillRect(col * CELL_SIZE, GAME_HEIGHT - WALL_THICKNESS, CELL_SIZE, WALL_THICKNESS);
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
